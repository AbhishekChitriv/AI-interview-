"""
Session API — inspect / reset the current linear run.

    GET  /api/session          current session id, stage, artifact keys
    POST /api/session/reset     start a brand-new run (new id + cookie)
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response

from session_manager import Stage, attach_session, current_session, manager

session_router = APIRouter(tags=["session"])

_STAGE_ORDER = [s.name for s in Stage]


def _view(record: dict) -> dict:
    stage = Stage(record["stage"])
    artifacts = record.get("artifacts") or {}
    return {
        "session_id": record["id"],
        "stage": stage.name,
        "stage_index": int(stage),
        "stage_label": stage.label,
        "stages": _STAGE_ORDER,
        "artifacts": sorted(artifacts.keys()),
        "candidate_name": artifacts.get("candidate_name", "Candidate"),
        "job_title": artifacts.get("job_title", "Software Candidate"),
        "candidate_profile": artifacts.get("candidate_profile"),
        "created_at": record.get("created_at"),
        "updated_at": record.get("updated_at"),
        "can": {
            "setup": True,
            "interview": stage >= Stage.SETUP_COMPLETE,
            "coding": stage >= Stage.INTERVIEW_COMPLETE,
            "performance": stage >= Stage.CODING_COMPLETE,
        },
    }


@session_router.get("/api/session")
async def read_session(session=Depends(current_session)):
    return _view(manager.get(session["id"]) or session)


@session_router.post("/api/session/reset")
async def reset_session(response: Response, session=Depends(current_session)):
    fresh = manager.reset(session["id"])
    attach_session(response, fresh)
    return _view(fresh)
