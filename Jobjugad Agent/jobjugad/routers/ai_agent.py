"""
Module 3 — AI Interview Live (Aptitude & Reasoning round).

The shipped Module 3 is the timed, webcam-proctored 20-question MCQ round
extracted from *AI Interview Live* (10 Quantitative Aptitude + 10 Logical
Reasoning). Question generation uses Groq via ``modules.aptitude`` and falls
back to a curated bank when no key / no network.

    POST /api/assessment/generate   -> 20 questions
    POST /api/assessment/evaluate   -> score + breakdown + review  (⇒ INTERVIEW_COMPLETE)

A generic ``GET /ws/interview/{session_id}`` WebSocket is also exposed. The
aptitude round itself is HTTP-only; the socket streams a live transcript / status
channel that a future conversational engine can plug into without touching the
orchestrator.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from config import settings
from modules.aptitude.aptitude_reasoning import (
    evaluate_aptitude_reasoning,
    generate_aptitude_reasoning_questions,
)
from session_manager import Stage, current_session, manager

logger = logging.getLogger("jobjugad.ai_agent")

interview_router = APIRouter(tags=["interview"])


class GenerateIn(BaseModel):
    target_role: Optional[str] = None
    candidate_name: str = "Candidate"
    groq_api_key: Optional[str] = None


class EvaluateIn(BaseModel):
    answers: Dict[str, Any] = Field(default_factory=dict)
    questions: List[Dict] = Field(default_factory=list)
    time_taken_seconds: int = 0


@interview_router.post("/api/assessment/generate")
async def assessment_generate(body: GenerateIn, session=Depends(current_session)):
    key = (body.groq_api_key or settings.groq_api_key or "").strip() or None
    try:
        result = generate_aptitude_reasoning_questions(
            api_key=key,
            target_role=body.target_role or (manager.get(session["id"]) or {}).get("artifacts", {}).get("job_title"),
            candidate_name=body.candidate_name,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Assessment generation failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    manager.set_artifact(session["id"], "assessment_questions", result.get("questions", []))
    return result


@interview_router.post("/api/assessment/evaluate")
async def assessment_evaluate(body: EvaluateIn, session=Depends(current_session)):
    try:
        result = evaluate_aptitude_reasoning(
            user_answers=body.answers,
            questions=body.questions,
            time_taken_seconds=body.time_taken_seconds,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Assessment evaluation failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    manager.set_artifact(session["id"], "assessment_result", result)
    manager.advance(session["id"], Stage.INTERVIEW_COMPLETE)
    result["session_id"] = session["id"]
    result["stage"] = "INTERVIEW_COMPLETE"
    return result


@interview_router.websocket("/ws/interview/{session_id}")
async def interview_socket(websocket: WebSocket, session_id: str):
    """Live transcript / status channel for an interview session.

    Echoes structured events and keeps a running transcript in the session
    directory (``transcript.log``). Ready for a conversational engine to push
    STT partials / agent turns / TTS cues through the same socket.
    """
    await websocket.accept()
    record = manager.get(session_id)
    if not record:
        await websocket.send_json({"type": "error", "message": "unknown session"})
        await websocket.close()
        return

    transcript = manager.dir(session_id) / "transcript.log"
    await websocket.send_json({"type": "ready", "session_id": session_id, "stage": Stage(record["stage"]).label})
    try:
        while True:
            msg = await websocket.receive_json()
            line = f"{msg.get('role', 'user')}: {msg.get('text', '')}\n"
            with transcript.open("a", encoding="utf-8") as fh:
                fh.write(line)
            await websocket.send_json({"type": "ack", "echo": msg})
    except WebSocketDisconnect:
        logger.info("interview socket closed for %s", session_id)
