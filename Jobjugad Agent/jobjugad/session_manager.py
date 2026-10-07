"""
session_manager.py — isolated session folders + strict linear state machine.

A JobJugad run walks through six stages, in order:

    INITIATED -> SETUP_COMPLETE -> INTERVIEW_COMPLETE -> CODING_COMPLETE
              -> AI_INTERVIEW_COMPLETE -> EVALUATED
       (0)           (1)                 (2)                   (3)
                        (4)                     (5)

Guards enforced by the orchestrator:
  * ``/interview``     needs state >= SETUP_COMPLETE
  * ``/coding``        needs state >= INTERVIEW_COMPLETE
  * ``/ai-interview``  needs state >= CODING_COMPLETE
  * ``/performance``   needs state >= AI_INTERVIEW_COMPLETE

Each session owns ``storage/sessions/<id>/`` for its artifacts (parsed resume,
JD, generated questions, assessment result, final report, uploaded audio…).
State + a small metadata blob live in Redis when ``REDIS_URL`` is set, otherwise
in an in-process dict; either way a ``state.json`` mirror is written to disk so
runs survive a restart.
"""
from __future__ import annotations

import json
import logging
import shutil
import time
import uuid
from enum import IntEnum
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import Cookie, Response

from config import settings, SESSIONS_DIR

logger = logging.getLogger("jobjugad.session")


class Stage(IntEnum):
    INITIATED = 0
    SETUP_COMPLETE = 1
    INTERVIEW_COMPLETE = 2
    CODING_COMPLETE = 3
    AI_INTERVIEW_COMPLETE = 4
    EVALUATED = 5

    @property
    def label(self) -> str:
        return {
            0: "Initiated",
            1: "Setup complete",
            2: "Interview complete",
            3: "Coding complete",
            4: "AI interview complete",
            5: "Evaluated",
        }[int(self)]


# ── storage backends ───────────────────────────────────────────────────────
class _MemoryBackend:
    def __init__(self) -> None:
        self._data: Dict[str, str] = {}

    def get(self, key: str) -> Optional[str]:
        return self._data.get(key)

    def set(self, key: str, value: str, ttl: int) -> None:  # ttl ignored in-memory
        self._data[key] = value

    def delete(self, key: str) -> None:
        self._data.pop(key, None)


class _RedisBackend:
    def __init__(self, url: str) -> None:
        import redis  # imported lazily; only needed when REDIS_URL is set

        self._r = redis.Redis.from_url(url, decode_responses=True)
        self._r.ping()

    def get(self, key: str) -> Optional[str]:
        return self._r.get(key)

    def set(self, key: str, value: str, ttl: int) -> None:
        self._r.set(key, value, ex=ttl)

    def delete(self, key: str) -> None:
        self._r.delete(key)


# ── manager ────────────────────────────────────────────────────────────────
class SessionManager:
    KEY_PREFIX = "jj:session:"

    def __init__(self) -> None:
        self.backend: Any
        if settings.use_redis:
            try:
                self.backend = _RedisBackend(settings.redis_url)
                logger.info("Session store: Redis (%s)", settings.redis_url)
            except Exception as exc:  # noqa: BLE001 — any redis failure => fallback
                logger.warning("Redis unavailable (%s); using in-memory sessions", exc)
                self.backend = _MemoryBackend()
        else:
            self.backend = _MemoryBackend()
            logger.info("Session store: in-memory (set REDIS_URL to persist)")

    # ── crud ──────────────────────────────────────────────────────────────
    def create(self) -> Dict[str, Any]:
        sid = uuid.uuid4().hex
        now = time.time()
        record = {
            "id": sid,
            "stage": int(Stage.INITIATED),
            "created_at": now,
            "updated_at": now,
            "artifacts": {},
        }
        self.dir(sid).mkdir(parents=True, exist_ok=True)
        self._persist(record)
        return record

    def get(self, sid: Optional[str]) -> Optional[Dict[str, Any]]:
        if not sid:
            return None
        raw = self.backend.get(self.KEY_PREFIX + sid)
        if raw:
            return json.loads(raw)
        # fall back to the on-disk mirror (survives restarts / memory backend)
        mirror = self.dir(sid) / "state.json"
        if mirror.exists():
            record = json.loads(mirror.read_text("utf-8"))
            self._persist(record)
            return record
        return None

    def get_or_create(self, sid: Optional[str]) -> Dict[str, Any]:
        return self.get(sid) or self.create()

    def advance(self, sid: str, stage: Stage) -> Dict[str, Any]:
        record = self.get(sid) or self.create()
        # linear: only ever move forward, never skip more than allowed / regress
        record["stage"] = max(int(record.get("stage", 0)), int(stage))
        record["updated_at"] = time.time()
        self._persist(record)
        return record

    def set_artifact(self, sid: str, key: str, value: Any) -> Dict[str, Any]:
        record = self.get(sid) or self.create()
        record.setdefault("artifacts", {})[key] = value
        record["updated_at"] = time.time()
        self._persist(record)
        return record

    def write_file(self, sid: str, name: str, data: bytes) -> Path:
        path = self.dir(sid) / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return path

    def reset(self, sid: Optional[str]) -> Dict[str, Any]:
        if sid:
            self.backend.delete(self.KEY_PREFIX + sid)
            shutil.rmtree(self.dir(sid), ignore_errors=True)
        return self.create()

    # ── helpers ───────────────────────────────────────────────────────────
    def dir(self, sid: str) -> Path:
        return SESSIONS_DIR / sid

    def stage_of(self, record: Optional[Dict[str, Any]]) -> Stage:
        return Stage(int((record or {}).get("stage", 0)))

    def _persist(self, record: Dict[str, Any]) -> None:
        self.backend.set(
            self.KEY_PREFIX + record["id"],
            json.dumps(record),
            settings.session_ttl_seconds,
        )
        try:
            (self.dir(record["id"]) / "state.json").write_text(
                json.dumps(record, indent=2), "utf-8"
            )
        except OSError as exc:
            logger.warning("Could not mirror session %s to disk: %s", record["id"], exc)


manager = SessionManager()


# ── FastAPI dependencies ───────────────────────────────────────────────────
def attach_session(response: Response, record: Dict[str, Any]) -> None:
    response.set_cookie(
        settings.session_cookie,
        record["id"],
        max_age=settings.session_ttl_seconds,
        httponly=True,
        samesite="lax",
    )


def current_session(
    response: Response,
    jj_session: Optional[str] = Cookie(default=None),
) -> Dict[str, Any]:
    """Return the caller's session, creating (and cookie-ing) one if needed."""
    existing = manager.get(jj_session)
    if existing:
        return existing
    fresh = manager.create()
    attach_session(response, fresh)
    return fresh
