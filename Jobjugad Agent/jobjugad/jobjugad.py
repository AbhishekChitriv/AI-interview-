"""
jobjugad.py — main orchestrator for the unified JobJugad platform.

Runs all four modules behind one FastAPI/Uvicorn app and enforces the strict
linear workflow:

    /dashboard  →  /setup  →  /interview  →  /coding  →  /ai-interview  →  /performance

  * Module routers are mounted at the paths their frontends already call
    (``/api/...``), so the copied frontends work unchanged.
  * Each module's HTML entry point is served through :func:`serve_module`,
    which rewrites asset URLs, injects the workflow shell, and applies the
    stage guard (redirecting back a step if the session isn't far enough).

Run:
    python jobjugad.py
    # or
    uvicorn jobjugad:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import logging
import re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, Optional

from fastapi import Cookie, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from config import FRONTEND_DIR, settings
from routers.ai_agent import interview_router
from routers.ai_interview import ai_interview_router
from routers.coding import coding_router
from routers.dashboard import dashboard_router
from routers.performance import performance_router
from routers.resume_jd import resume_jd_router
from routers.session import session_router
from session_manager import Stage, attach_session, manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(name)s  %(message)s",
)
logger = logging.getLogger("jobjugad")


# ── lifespan ───────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("JobJugad starting — LLM provider: %s", settings.llm_provider)
    app.state.mongo = None
    if settings.use_mongo:
        try:
            # pyrefly: ignore [missing-import]
            from pymongo import MongoClient

            client = MongoClient(settings.mongo_uri, serverSelectionTimeoutMS=3000)
            client.admin.command("ping")
            app.state.mongo = client[settings.mongo_db]
            logger.info("MongoDB connected (%s)", settings.mongo_db)
        except Exception as exc:  # noqa: BLE001
            logger.warning("MongoDB unavailable (%s); using file storage only", exc)
    logger.info("Session store backend: %s", type(manager.backend).__name__)
    yield
    logger.info("JobJugad shutting down")


app = FastAPI(
    title="JobJugad — AI-Powered Interview & Career Assistant",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── global exception handler ───────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "internal_error", "detail": str(exc), "path": request.url.path},
    )


# ── module routers ─────────────────────────────────────────────────────────
app.include_router(session_router)
app.include_router(dashboard_router)
app.include_router(resume_jd_router)
app.include_router(interview_router)
app.include_router(coding_router)
app.include_router(ai_interview_router)
app.include_router(performance_router)


# ── static asset mounts (css / js / images the module HTML references) ─────
for _name in ("dashboard", "setup", "interview", "coding", "ai-interview", "performance"):
    app.mount(f"/m/{_name}", StaticFiles(directory=FRONTEND_DIR / _name), name=f"assets-{_name}")
app.mount("/jj", StaticFiles(directory=FRONTEND_DIR / "_shell"), name="assets-shell")


# ── module page serving ────────────────────────────────────────────────────
_SHELL_TAGS = (
    '<link rel="stylesheet" href="/jj/shell.css">'
    '<script src="/jj/shell.js" defer></script>'
)

_MODULES: Dict[str, dict] = {
    "dashboard": {
        "guard": Stage.INITIATED,
        "back": "/dashboard",
        "rewrites": {"/static/": "/m/dashboard/"},
    },
    "setup": {
        "guard": Stage.INITIATED,
        "back": "/dashboard",
        "rewrites": {'href="styles.css"': 'href="/m/setup/styles.css"', 'src="app.js"': 'src="/m/setup/app.js"'},
    },
    "interview": {
        "guard": Stage.SETUP_COMPLETE,
        "back": "/setup",
        "rewrites": {},
    },
    "coding": {
        "guard": Stage.INTERVIEW_COMPLETE,
        "back": "/interview",
        "rewrites": {"/static/": "/m/coding/"},
    },
    "ai-interview": {
        "guard": Stage.CODING_COMPLETE,
        "back": "/coding",
        "rewrites": {"/static/": "/m/ai-interview/"},
    },
    "performance": {
        "guard": Stage.AI_INTERVIEW_COMPLETE,
        "back": "/ai-interview",
        "rewrites": {'href="style.css"': 'href="/m/performance/style.css"', 'src="app.js"': 'src="/m/performance/app.js"'},
    },
}


_BODY_BANNERS: Dict[str, str] = {}

# Per-module script injected last (after the shell). On the setup page it turns
# the "Generate Questions & Launch Live AI HR Interview" button into a plain
# "Continue to Aptitude Test →" — a parsed resume goes straight to Module 3,
# no Eliora question generation.
_SETUP_TAIL = """
<script>
(function () {
  function patch() {
    var btn = document.getElementById('launchInterviewBtn');
    if (!btn) return;
    var next = btn.cloneNode(true);            // drop app.js's modal handler
    var label = next.querySelector('.launch-text');
    if (label) label.textContent = 'Continue to Aptitude Test  \\u2192';
    next.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      next.disabled = true;
      var name = (document.getElementById('candidateNameInput') || {}).value || '';
      var roleInput = document.getElementById('jobTitleInput');
      var roleSelect = document.getElementById('targetJobTitleSelect');
      var role = (roleInput && roleInput.value ? roleInput.value : (roleSelect && roleSelect.value ? roleSelect.value : '')).trim();
      fetch('/api/setup/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_name: name, job_title: role })
      }).then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.success === false) { alert(d.error || 'Extract a resume first.'); next.disabled = false; return; }
          location.href = '/interview';
        })
        .catch(function () { location.href = '/interview'; });
    }, true);
    btn.parentNode.replaceChild(next, btn);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patch);
  else patch();
})();
</script>
"""

_MODULE_TAILS: Dict[str, str] = {"setup": _SETUP_TAIL}

_BODY_OPEN_RE = re.compile(r"<body[^>]*>", re.IGNORECASE)


def _render_page(name: str) -> str:
    cfg = _MODULES[name]
    html = (FRONTEND_DIR / name / "index.html").read_text("utf-8")
    for old, new in cfg["rewrites"].items():
        html = html.replace(old, new)

    banner = _BODY_BANNERS.get(name)
    if banner:
        html = _BODY_OPEN_RE.sub(lambda m: m.group(0) + banner, html, count=1)

    tail = _SHELL_TAGS + _MODULE_TAILS.get(name, "")
    if "</body>" in html:
        html = html.replace("</body>", f"{tail}</body>", 1)
    else:
        html += tail
    return html


def serve_module(name: str, response: Response, jj_session: Optional[str]):
    record = manager.get_or_create(jj_session)
    if record["id"] != jj_session:
        attach_session(response, record)

    guard: Stage = _MODULES[name]["guard"]
    if manager.stage_of(record) < guard:
        redirect = RedirectResponse(url=f"{_MODULES[name]['back']}?need={name}", status_code=303)
        if record["id"] != jj_session:
            attach_session(redirect, record)
        return redirect

    page = HTMLResponse(_render_page(name))
    page.headers["Cache-Control"] = "no-store"
    if record["id"] != jj_session:
        attach_session(page, record)
    return page


@app.get("/dashboard", response_class=HTMLResponse)
async def page_dashboard(response: Response, jj_session: Optional[str] = Cookie(default=None)):
    return serve_module("dashboard", response, jj_session)


@app.get("/setup", response_class=HTMLResponse)
async def page_setup(response: Response, jj_session: Optional[str] = Cookie(default=None)):
    return serve_module("setup", response, jj_session)


@app.get("/interview", response_class=HTMLResponse)
async def page_interview(response: Response, jj_session: Optional[str] = Cookie(default=None)):
    return serve_module("interview", response, jj_session)


@app.get("/coding", response_class=HTMLResponse)
async def page_coding(response: Response, jj_session: Optional[str] = Cookie(default=None)):
    return serve_module("coding", response, jj_session)


@app.get("/ai-interview", response_class=HTMLResponse)
async def page_ai_interview(response: Response, jj_session: Optional[str] = Cookie(default=None)):
    return serve_module("ai-interview", response, jj_session)


@app.get("/performance", response_class=HTMLResponse)
async def page_performance(response: Response, jj_session: Optional[str] = Cookie(default=None)):
    return serve_module("performance", response, jj_session)


# ── landing + health ───────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def landing(response: Response, jj_session: Optional[str] = Cookie(default=None)):
    # The root URL has no page of its own — it drops the visitor straight on the
    # Dashboard. A session cookie is minted here so /dashboard loads cleanly.
    record = manager.get_or_create(jj_session)
    redirect = RedirectResponse(url="/dashboard", status_code=307)
    if record["id"] != jj_session:
        attach_session(redirect, record)
    return redirect


@app.get("/healthz")
async def healthz():
    return {
        "status": "ok",
        "llm_provider": settings.llm_provider,
        "redis": settings.use_redis,
        "mongo": bool(getattr(app.state, "mongo", None)),
        "session_backend": type(manager.backend).__name__,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "jobjugad:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        app_dir=str(Path(__file__).resolve().parent),
    )
