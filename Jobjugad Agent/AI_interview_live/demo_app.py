"""
Standalone demo runner for the aptitude round.

    python aptitude_round/demo_app.py
    # then open http://127.0.0.1:8077

Serves the extracted frontend (demo/index.html + frontend/*) and mounts the
backend router. No GROQ_API_KEY needed - falls back to the curated bank.
"""
import os
import sys

import uvicorn
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _HERE)

from backend import aptitude_router  # noqa: E402

app = FastAPI(title="Aptitude Round Demo")
app.include_router(aptitude_router)

app.mount("/static", StaticFiles(directory=os.path.join(_HERE, "frontend")), name="static")


@app.get("/")
async def index():
    return FileResponse(os.path.join(_HERE, "demo", "index.html"))


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8077, log_level="info")
