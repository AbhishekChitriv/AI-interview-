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
    def safe_create(*args, **kwargs):
        groq_model = os.getenv("GROQ_MODEL")
        if groq_model:
            kwargs["model"] = groq_model
        try:
            return orig_create(*args, **kwargs)
        except Exception as err:
            err_str = str(err).lower()
            if ("model_not_found" in err_str or "does not exist" in err_str or "404" in err_str) and kwargs.get("model") != "groq/compound-mini":
                kwargs["model"] = "groq/compound-mini"
                return orig_create(*args, **kwargs)
            raise
    client.chat.completions.create = safe_create
    return client
