"""
Module 3.75 — AI Interview Round ("Eliora").

A conversational, webcam+voice interview round ported from the standalone
"phase 1.1" Eliora AI Interview Platform. Questions are generated from the
candidate's parsed resume + target role (Groq, same pattern as the aptitude
and coding rounds) and each spoken answer is scored live; a final report is
synthesized once the candidate ends the session.

    GET  /api/ai-interview/context   -> candidate/job info for the intro screen
    POST /api/ai-interview/start     -> tailored questions       (needs CODING_COMPLETE)
    POST /api/ai-interview/evaluate  -> per-answer scoring
    POST /api/ai-interview/report    -> final report              (⇒ AI_INTERVIEW_COMPLETE)
    POST /api/ai-interview/tts       -> streamed speech audio (edge-tts, best-effort)

Sits between the coding round (``/coding``) and the performance report
(``/performance``) in the strict linear workflow. Recording history reuses
the existing generic ``/api/history`` endpoints in ``routers/dashboard.py``.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from config import settings
from modules.ai_interview.evaluation import evaluate_answer, generate_final_report
from modules.ai_interview.question import generate_interview_questions
from session_manager import Stage, current_session, manager

logger = logging.getLogger("jobjugad.ai_interview")

ai_interview_router = APIRouter(tags=["ai_interview"])


def _resume_context(artifacts: Dict[str, Any]) -> str:
    """Same résumé-context assembly used by the coding round — structured
    profile fields (role, skills, experience, education, achievements) plus
    the raw extracted resume text, so questions are grounded in what the
    candidate actually put on their resume."""
    raw = (artifacts.get("resume_text") or "").strip()
    profile = artifacts.get("candidate_profile") or {}

    lines: List[str] = []
    if profile.get("primary_role"):
        lines.append(f"Current / target role: {profile['primary_role']}")
    if profile.get("total_experience"):
        lines.append(f"Total experience: {profile['total_experience']}")
    if profile.get("top_skills"):
        lines.append("Key skills: " + ", ".join(str(s) for s in profile["top_skills"]))
    if profile.get("education"):
        lines.append("Education: " + "; ".join(str(e) for e in profile["education"]))
    if profile.get("key_achievements"):
        lines.append("Achievements: " + "; ".join(str(a) for a in profile["key_achievements"]))
    if profile.get("summary"):
        lines.append(f"Professional summary: {profile['summary']}")

    structured = "\n".join(lines)
    if raw and structured:
        return f"{structured}\n\n--- Full resume text ---\n{raw}"
    return raw or structured


def _target_role(body_role: Optional[str], artifacts: Dict[str, Any]) -> str:
    profile = artifacts.get("candidate_profile") or {}
    return (
        (body_role or "").strip()
        or (artifacts.get("job_title") or "").strip()
        or (profile.get("primary_role") or "").strip()
        or "Software Engineer"
    )


class AIInterviewStartIn(BaseModel):
    num_questions: int = 10
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None
    groq_api_key: Optional[str] = None


class AIInterviewEvaluateIn(BaseModel):
    question: str = ""
    category: str = "Technical"
    candidate_answer: str = ""
    job_title: str = "Software Engineer"
    groq_api_key: Optional[str] = None


class AIInterviewReportIn(BaseModel):
    evaluations: List[Dict[str, Any]] = Field(default_factory=list)
    candidate_name: str = "Candidate"
    job_title: str = "Target Role"
    groq_api_key: Optional[str] = None


class TTSIn(BaseModel):
    text: str
    voice: str = "en-US-AriaNeural"


@ai_interview_router.get("/api/ai-interview/context")
async def ai_interview_context(session=Depends(current_session)):
    """Everything the intro screen needs to skip straight to launch — the
    candidate's name/role/résumé & JD availability from Setup, no re-upload."""
    record = manager.get(session["id"]) or {}
    artifacts = record.get("artifacts", {})
    profile = artifacts.get("candidate_profile") or {}

    return {
        "candidate_name": artifacts.get("candidate_name")
        or profile.get("candidate_name")
        or "Candidate",
        "job_title": _target_role(None, artifacts),
        "has_resume": bool(_resume_context(artifacts)),
        "has_jd": bool((artifacts.get("jd_text") or "").strip()),
    }


@ai_interview_router.post("/api/ai-interview/start")
async def ai_interview_start(body: AIInterviewStartIn, session=Depends(current_session)):
    record = manager.get(session["id"]) or {}
    if manager.stage_of(record) < Stage.CODING_COMPLETE:
        raise HTTPException(status_code=409, detail="Finish the coding round before the AI interview round.")

    artifacts = record.get("artifacts", {})
    key = (body.groq_api_key or settings.groq_api_key or "").strip() or None

    resume_ctx = _resume_context(artifacts) or "Software developer candidate."
    jd_text = (artifacts.get("jd_text") or "").strip() or None
    job_title = _target_role(body.job_title, artifacts)
    candidate_name = (
        (body.candidate_name or "").strip()
        if (body.candidate_name or "").strip().lower() not in ("", "candidate")
        else artifacts.get("candidate_name") or "Candidate"
    )
    num_questions = max(3, min(int(body.num_questions or 10), 20))

    try:
        result = generate_interview_questions(
            resume=resume_ctx,
            job_description=jd_text,
            num_questions=num_questions,
            api_key=key,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("AI interview question generation failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    manager.set_artifact(session["id"], "ai_interview_questions", result.get("questions", []))
    manager.set_artifact(
        session["id"],
        "ai_interview_meta",
        {"candidate_name": candidate_name, "job_title": job_title, "used_resume": bool(resume_ctx), "used_jd": bool(jd_text)},
    )
    logger.info("AI interview for session %s: role=%r questions=%d", session["id"], job_title, result.get("total_questions"))
    return result


@ai_interview_router.post("/api/ai-interview/evaluate")
async def ai_interview_evaluate(body: AIInterviewEvaluateIn, session=Depends(current_session)):
    if manager.stage_of(manager.get(session["id"])) < Stage.CODING_COMPLETE:
        raise HTTPException(status_code=409, detail="Finish the coding round before the AI interview round.")

    key = (body.groq_api_key or settings.groq_api_key or "").strip() or None
    try:
        result = evaluate_answer(
            question=body.question,
            candidate_answer=body.candidate_answer,
            category=body.category,
            job_title=body.job_title,
            api_key=key,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("AI interview answer evaluation failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
    return result


@ai_interview_router.post("/api/ai-interview/report")
async def ai_interview_report(body: AIInterviewReportIn, session=Depends(current_session)):
    if manager.stage_of(manager.get(session["id"])) < Stage.CODING_COMPLETE:
        raise HTTPException(status_code=409, detail="Finish the coding round before the AI interview round.")

    key = (body.groq_api_key or settings.groq_api_key or "").strip() or None
    try:
        report = generate_final_report(
            evaluations=body.evaluations,
            candidate_name=body.candidate_name,
            job_title=body.job_title,
            api_key=key,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("AI interview report generation failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    manager.set_artifact(session["id"], "ai_interview_result", report)
    manager.advance(session["id"], Stage.AI_INTERVIEW_COMPLETE)
    report["session_id"] = session["id"]
    report["stage"] = "AI_INTERVIEW_COMPLETE"
    return report


@ai_interview_router.post("/api/ai-interview/tts")
async def ai_interview_tts(body: TTSIn):
    """Best-effort speech synthesis via edge-tts. The frontend falls back to
    the browser's own speechSynthesis API if this errors or is unreachable."""
    try:
        import edge_tts
    except ImportError:
        raise HTTPException(status_code=503, detail="edge-tts is not installed on the server.")

    try:
        communicate = edge_tts.Communicate(body.text, body.voice)

        async def audio_generator():
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]

        return StreamingResponse(audio_generator(), media_type="audio/mpeg")
    except Exception as exc:  # noqa: BLE001
        logger.error("TTS synthesis error: %s", exc)
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {exc}")
