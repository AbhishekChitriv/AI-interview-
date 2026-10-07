"""
config.py — centralised environment / settings loader for JobJugad.

Everything the app needs to know about API keys, optional infrastructure
(Redis / MongoDB) and runtime options is read here, once, from the process
environment (populated from a local ``.env`` file via python-dotenv).

Nothing else in the codebase should call ``os.environ`` directly — import
``settings`` from here instead.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import List

try:
    from dotenv import load_dotenv
except ImportError:  # dotenv is optional, env vars may be set another way
    def load_dotenv(*_a, **_kw):  # type: ignore
        return False

# ── paths ──────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"
STORAGE_DIR = BASE_DIR / "storage"
SESSIONS_DIR = STORAGE_DIR / "sessions"

def _get_desktop_history_dir() -> Path:
    home = Path.home()
    onedrive_desktop = home / "OneDrive" / "Desktop"
    desktop = onedrive_desktop if onedrive_desktop.exists() else home / "Desktop"
    history_dir = desktop / "Interview Recordings"
    history_dir.mkdir(parents=True, exist_ok=True)

    # Migrate any legacy recordings from local storage folder to Desktop folder
    legacy_dir = STORAGE_DIR / "Interview_Recordings_History"
    if legacy_dir.exists():
        import shutil
        for file_path in legacy_dir.glob("*"):
            if file_path.is_file():
                dest = history_dir / file_path.name
                if not dest.exists():
                    try:
                        shutil.copy2(file_path, dest)
                    except Exception:
                        pass
    return history_dir

HISTORY_DIR = _get_desktop_history_dir()

# Load .env from the package dir first, then the repo root as a fallback.
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")


def _split_csv(value: str) -> List[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    # ── LLM provider switch ────────────────────────────────────────────────
    # One of: openai | gemini | groq | anthropic
    llm_provider: str = os.getenv("LLM_PROVIDER", "groq").strip().lower()

    openai_api_key: str = os.getenv("OPENAI_API_KEY", "").strip()
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "").strip()
    groq_api_key: str = os.getenv("GROQ_API_KEY", "").strip()
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "").strip()

    # Per-provider model overrides (sensible defaults if unset)
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
    groq_model: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()
    anthropic_model: str = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514").strip()

    coding_groq_model: str = os.getenv("CODING_GROQ_MODEL", "openai/gpt-oss-120b").strip()
    aptitude_groq_model: str = os.getenv("APTITUDE_GROQ_MODEL", "openai/gpt-oss-120b").strip()
    ai_interview_groq_model: str = os.getenv("AI_INTERVIEW_GROQ_MODEL", "openai/gpt-oss-120b").strip()

    request_timeout: int = int(os.getenv("LLM_TIMEOUT", "45"))

    # ── optional infrastructure ───────────────────────────────────────────
    redis_url: str = os.getenv("REDIS_URL", "").strip()
    mongo_uri: str = os.getenv("MONGO_URI", "").strip()
    mongo_db: str = os.getenv("MONGO_DB", "jobjugad").strip()

    # ── server ────────────────────────────────────────────────────────────
    host: str = os.getenv("HOST", "127.0.0.1").strip()
    port: int = int(os.getenv("PORT", "8000"))
    reload: bool = os.getenv("RELOAD", "false").strip().lower() in {"1", "true", "yes"}

    cors_origins: List[str] = field(
        default_factory=lambda: _split_csv(os.getenv("CORS_ORIGINS", "*"))
    )

    # ── session ───────────────────────────────────────────────────────────
    session_cookie: str = os.getenv("SESSION_COOKIE", "jj_session").strip()
    session_ttl_seconds: int = int(os.getenv("SESSION_TTL", str(60 * 60 * 12)))

    # ── derived helpers ───────────────────────────────────────────────────
    def api_key_for(self, provider: str) -> str:
        return {
            "openai": self.openai_api_key,
            "gemini": self.gemini_api_key,
            "groq": self.groq_api_key,
            "anthropic": self.anthropic_api_key,
            "claude": self.anthropic_api_key,
        }.get(provider.lower(), "")

    def model_for(self, provider: str) -> str:
        return {
            "openai": self.openai_model,
            "gemini": self.gemini_model,
            "groq": self.groq_model,
            "anthropic": self.anthropic_model,
            "claude": self.anthropic_model,
        }.get(provider.lower(), self.groq_model)

    @property
    def use_redis(self) -> bool:
        return bool(self.redis_url)

    @property
    def use_mongo(self) -> bool:
        return bool(self.mongo_uri)


@lru_cache
def get_settings() -> Settings:
    for path in (STORAGE_DIR, SESSIONS_DIR, HISTORY_DIR):
        path.mkdir(parents=True, exist_ok=True)
    return Settings()


settings = get_settings()
