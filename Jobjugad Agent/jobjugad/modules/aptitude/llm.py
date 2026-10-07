from openai import OpenAI
import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from the project root (two levels up from here)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

def get_openai_client(api_key: str | None = None):
    key = api_key or os.getenv("GROQ_API_KEY", "").strip()
    client = OpenAI(
        api_key=key,
        base_url="https://api.groq.com/openai/v1",
    )
    orig_create = client.chat.completions.create
    # This round has its own model knob (APTITUDE_GROQ_MODEL) so the platform-wide
    # GROQ_MODEL used by the LLM factory doesn't force a tool-augmented model here.
    _FALLBACKS = ("openai/gpt-oss-120b", "llama-3.3-70b-versatile", "qwen/qwen3-32b")

    def safe_create(*args, **kwargs):
        override = os.getenv("APTITUDE_GROQ_MODEL")
        if override:
            kwargs["model"] = override
        try:
            return orig_create(*args, **kwargs)
        except Exception as err:
            err_str = str(err).lower()
            transient = any(k in err_str for k in ("model_not_found", "does not exist", "404", "413", "too large", "decommission", "rate_limit", "rate limit", "429", "tpm"))
            import time
            for fb in _FALLBACKS:
                if transient and kwargs.get("model") != fb:
                    try:
                        time.sleep(1.0)
                        kwargs["model"] = fb
                        return orig_create(*args, **kwargs)
                    except Exception:  # noqa: BLE001 — try the next fallback
                        continue
            raise
    client.chat.completions.create = safe_create
    return client
