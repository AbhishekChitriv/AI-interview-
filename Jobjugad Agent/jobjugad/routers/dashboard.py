"""
Module 1 — Candidate Dashboard.

Ported verbatim (behaviour-wise) from ``Dashboard/app.py``: interview-session
history list / save / video playback, plus the "open recordings folder" helper.
Adds one orchestration endpoint — ``POST /api/dashboard/start`` — which the shell
uses to begin (or restart) a linear session and hand the user to Module 2.
"""
from __future__ import annotations

import json
import logging
import platform
import subprocess
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse

from config import HISTORY_DIR
from session_manager import Stage, attach_session, current_session, manager

logger = logging.getLogger("jobjugad.dashboard")

dashboard_router = APIRouter(tags=["dashboard"])


@dashboard_router.get("/api/history")
async def get_history():
    history = []
    for path in HISTORY_DIR.glob("*.json"):
        try:
            history.append(json.loads(path.read_text("utf-8")))
        except (OSError, json.JSONDecodeError) as exc:
            logger.error("Bad history file %s: %s", path.name, exc)
    history.sort(key=lambda item: str(item.get("id", "")), reverse=True)
    return history


@dashboard_router.post("/api/history")
async def save_history(
    sessionData: str = Form(...),
    videoBlob: Optional[UploadFile] = File(None),
):
    try:
        data = json.loads(sessionData)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"sessionData is not valid JSON: {exc}")

    session_id = data.get("id") or f"session_{int(datetime.now().timestamp() * 1000)}"
    data["id"] = session_id

    if videoBlob is not None:
        content = await videoBlob.read()
        (HISTORY_DIR / f"{session_id}.webm").write_bytes(content)
        data["videoBlobUrl"] = f"/api/history/video/{session_id}"

    (HISTORY_DIR / f"{session_id}.json").write_text(json.dumps(data, indent=4), "utf-8")
    return {"status": "success", "message": "History saved.", "id": session_id}


@dashboard_router.get("/api/history/video/{session_id}")
async def get_video(session_id: str):
    video_path = HISTORY_DIR / f"{session_id}.webm"
    if video_path.exists():
        return FileResponse(str(video_path), media_type="video/webm")
    raise HTTPException(status_code=404, detail="Video not found")


@dashboard_router.get("/api/open-history-folder")
async def open_history_folder():
    try:
        system = platform.system()
        if system == "Windows":
            import os

            os.startfile(str(HISTORY_DIR))  # type: ignore[attr-defined]
        elif system == "Darwin":
            subprocess.Popen(["open", str(HISTORY_DIR)])
        else:
            subprocess.Popen(["xdg-open", str(HISTORY_DIR)])
        return {"status": "success", "message": "Folder opened"}
    except Exception as exc:  # noqa: BLE001
        logger.error("Could not open history folder: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@dashboard_router.post("/api/dashboard/start")
async def start_interview(response: Response, session=Depends(current_session)):
    """Begin a fresh linear run. Resets any in-progress session."""
    fresh = manager.reset(session["id"])
    attach_session(response, fresh)
    return {
        "status": "success",
        "session_id": fresh["id"],
        "stage": Stage(fresh["stage"]).label,
        "next": "/setup",
    }
