# JobJugad — unified AI Interview & Career Assistant

One FastAPI/Uvicorn app that runs all modules behind a **strict linear
workflow**:

```
/dashboard  ─▶  /setup  ─▶  /interview  ─▶  /coding   ─▶  /performance
 Module 1       Module 2      Module 3       Module 3.5      Module 4
```

* `/interview` is unreachable until Module 2 has parsed a resume
  (`stage ≥ SETUP_COMPLETE`); after extraction the shell shows
  **Continue to Aptitude Test →** — Eliora question generation is optional.
* `/coding` is unreachable until Module 3's aptitude round is scored
  (`stage ≥ INTERVIEW_COMPLETE`). It generates a 5-question, resume-tailored
  hands-on coding round (2 Easy / 2 Moderate / 1 Hard), webcam-proctored,
  AI-reviewed (no code execution).
* `/performance` is unreachable until Module 3.5's coding round is scored
  (`stage ≥ CODING_COMPLETE`).

The guard is enforced **server-side** (page routes 303-redirect back a step) and
mirrored in the injected top nav bar.

---

## Quick start

```bash
cd jobjugad
python -m venv .venv && .venv\Scripts\activate      # Windows
pip install -r requirements.txt
copy .env.example .env                              # then paste your API keys
python jobjugad.py
```

Open <http://127.0.0.1:8000>. API docs at `/docs`, health at `/healthz`.

Runs with **zero external services** — no Redis, no MongoDB, no paid keys
required (Modules 3 & 3.5 fall back to curated question banks; Modules 2 & 4
need at least one LLM key to do anything useful).

---

## Layout

```
jobjugad/
├── jobjugad.py          Orchestrator: FastAPI app, lifespan, CORS, exception
│                        handler, router mounts, linear page guard + shell.
├── config.py            All env / settings (API keys, Redis, Mongo, server).
├── llm_factory.py       Unified LLM client — openai | gemini | groq | anthropic.
├── session_manager.py   Isolated storage/sessions/<id>/ dirs + 5-stage machine.
├── routers/
│   ├── session.py       /api/session[...]         inspect / reset the run
│   ├── dashboard.py     Module 1  (ported from Dashboard/app.py)
│   ├── resume_jd.py     Module 2  (ported from "Resume & JD setup/server.py")
│   ├── ai_agent.py      Module 3  (aptitude round + /ws/interview/{id})
│   ├── coding.py        Module 3.5  (coding round, ported from Coding_Round_Standalone)
│   └── performance.py   Module 4  (JSON summary + PDF export, new backend)
├── modules/
│   ├── aptitude/        Copied verbatim from AI_interview_live/backend/
│   └── coding/          Copied from Coding_Round_Standalone (coding_round.py + llm.py)
├── frontend/
│   ├── dashboard/  setup/  interview/  coding/  performance/    module UIs (copied)
│   └── _shell/          workflow nav bar injected into every page
├── storage/
│   ├── sessions/<id>/   state.json, resume, questions, report.json, transcript…
│   └── Interview_Recordings_History/   Module 1 history (*.json / *.webm)
├── requirements.txt
└── .env.example
```

---

## Endpoints

| Module | Method & path | Effect |
|---|---|---|
| Session | `GET /api/session` · `POST /api/session/reset` | inspect / restart run |
| 1 | `GET/POST /api/history`, `GET /api/history/video/{id}`, `GET /api/open-history-folder` | session history |
| 1 | `POST /api/dashboard/start` | reset session, go to `/setup` |
| 2 | `POST /api/upload` | extract text from PDF/DOCX/TXT |
| 2 | `POST /api/extract-resume` | resume → structured profile → **SETUP_COMPLETE** |
| 2 | `POST /api/analyze-alignment` | resume + JD → match/gap analysis → **SETUP_COMPLETE** |
| 2 | `POST /api/setup/complete` | proceed to Module 3 (needs a parsed resume) |
| 2 | `POST /api/generate-questions` | optional Eliora questions (also → SETUP_COMPLETE) |
| 2 | `POST /api/evaluate-response` | per-answer feedback (optional Eliora mini-interview) |
| 3 | `POST /api/assessment/generate` | 20 aptitude+reasoning MCQs |
| 3 | `POST /api/assessment/evaluate` | score + review → **INTERVIEW_COMPLETE** |
| 3 | `WS /ws/interview/{session_id}` | live transcript / status channel |
| 3.5 | `GET /api/coding/context` | intro-screen data: detected role, role options, language-plan preview (`?role=`) |
| 3.5 | `POST /api/coding/generate` | 5 resume-tailored coding questions on the role's language plan (needs INTERVIEW_COMPLETE) |
| 3.5 | `POST /api/coding/evaluate` | AI code review + score → **CODING_COMPLETE** |
| 4 | `GET /api/performance/current` · `GET /api/performance/{id}` | scored JSON summary |
| 4 | `GET /api/performance/{id}/narrative` | LLM executive debrief |
| 4 | `GET /api/performance/{id}/report.pdf` | download PDF (HTML fallback) |
| 4 | `POST /api/performance/{id}` | persist final report → **EVALUATED** |

Every request carries the run via the `jj_session` cookie (set automatically on
first page load).

---

## Multi-LLM switcher

`llm_factory.get_llm(provider?)` returns one client with a uniform
`.complete(prompt, system, json_mode=…)` / `.complete_json(...)`. Provider is the
`provider=` arg, else `LLM_PROVIDER` from `.env`. Only `requests` is used — no
provider SDKs. Module 2 endpoints accept a per-request `"provider"` field so a
caller can route a single call to `openai` / `gemini` / `groq` / `claude`.

```python
from llm_factory import get_llm
text = get_llm("gemini").complete("Summarise this JD…", json_mode=False)
data = get_llm().complete_json("Return {\"score\": int}…")
```

---

## Optional infrastructure

| Env var | When set | When unset (default) |
|---|---|---|
| `REDIS_URL` | session state in Redis (survives multi-worker) | in-process dict + `state.json` mirror |
| `MONGO_URI` | Mongo handle exposed on `app.state.mongo` | file storage under `storage/` only |

Both are probed at startup and **degrade silently** if unreachable.

---

## How the 4 original modules were attached (minimal refactor)

| Original | What changed | Where it lives now |
|---|---|---|
| `Dashboard/app.py` | already FastAPI — endpoints copied onto `dashboard_router`, paths unchanged; `HISTORY_DIR` → `storage/Interview_Recordings_History/` | `routers/dashboard.py` |
| `Resume & JD setup/server.py` | was a raw `http.server` — handler bodies ported to `APIRouter` endpoints with identical JSON shapes; hard-coded Groq/Gemini calls swapped for `llm_factory` | `routers/resume_jd.py` |
| `AI_interview_live/backend/` | copied as-is into `modules/aptitude/`; the 2 endpoints re-declared on `interview_router` to hook session state; `llm.py` gained an `APTITUDE_GROQ_MODEL` knob + a wider fallback chain | `modules/aptitude/` + `routers/ai_agent.py` |
| `Coding_Round_Standalone/` | `coding_round.py` + `llm.py` copied into `modules/coding/` (import made package-relative, `CODING_GROQ_MODEL` knob); its 2 endpoints re-declared on `coding_router` to read resume/JD/role from session artifacts and hook stage state; `static/` copied to `frontend/coding/` (setup form auto-hydrated from the session) | `modules/coding/` + `routers/coding.py` + `frontend/coding/` |
| `performance/` | was static-only (mock data) — kept as the Module 4 UI; a real backend added for JSON summary + PDF, aggregating session artifacts (now blends the coding round too) | `routers/performance.py` + `frontend/performance/` |

**Frontends** were copied under `frontend/<module>/`. Their `/api/...` calls are
absolute so they hit the routers unchanged; only stylesheet/script URLs are
rewritten at serve time (`/static/…` → `/m/dashboard/…`, `/m/coding/…`, etc.)
and the workflow shell (`/jj/shell.js`) is injected before `</body>`.

To update a module: edit files in its original folder, then re-copy into
`jobjugad/` (frontends → `frontend/<module>/`, round logic → `modules/<module>/`).

---

## Notes / scope

* **Module 3 is the aptitude & reasoning round** (10 quantitative + 10 logical
  MCQs, webcam-proctored) that actually exists in `AI_interview_live/`. The
  Deepgram/Cartesia/WebRTC voice pipeline described in the original brief is not
  implemented — no such code or keys were present. `/ws/interview/{id}` is a
  ready socket seam for adding one later.
* **Module 3.5 is the coding round** ported from `Coding_Round_Standalone/`.
  It is wired to the resume: `routers/coding.py` builds the generation context
  from the session — the structured profile Eliora parsed in Setup
  (`candidate_profile`: role, skills, experience, education, achievements) plus
  the raw `resume_text` and any `jd_text`.
* **The candidate picks the target job role** on the intro screen — a dropdown
  pre-selected to the résumé-detected role (`GET /api/coding/context`), with an
  "Other…" free-text option. The screen shows a live preview of which
  language(s) that role will be tested on, and the pick is authoritative.
* **The language of each of the 5 questions is a server-side plan**
  (`_resolve_language_plan()`), decided from the role first with a résumé/JD
  keyword tiebreak, and handed to the LLM as a fixed per-question constraint
  (the model is *not* asked to infer it — small models pick SQL whenever a
  developer résumé mentions a database). Every returned question is forced back
  onto its assigned language:
  * **Data Analyst / BI / Reporting → SQL + Python** (3 real-query SQL + 2 pandas)
  * **Data Engineer / Analytics Engineer → SQL + Python** (2 SQL + 3 Python)
  * Data Scientist / ML with SQL on the résumé → Python ×4 + one SQL query
  * Data Scientist / ML → Python · Frontend / React / UI → JavaScript
  * generic **Software / Backend / Full Stack → the main programming language on
    the résumé** — scored from the ordered `candidate_profile.top_skills` (first
    listed language wins, +6/+5/+4…) and weighted résumé/JD keyword counts
    (language name ×3, framework ×1); a Full Stack résumé built on Java + Spring
    gets a **Java** round, one built on React + Node gets JavaScript, C# + .NET
    gets C#, etc. Offline pools exist for Python / SQL / JavaScript / Java.
  * fallback → Python
  A hand-picked role skips the "analyst title on a dev résumé is a mis-parse"
  guard (auto-detected roles still get it). The plan (`language_plan`,
  `language_summary`, `is_mixed`) is stored as the `coding_generation` artifact
  and surfaced in the report ("Coding Round (3 SQL + 2 Python)").
* **Every candidate gets a different set.** Generation uses a fresh UUID nonce
  per call, a randomly rotated scenario domain (e-commerce, healthcare,
  logistics…), `temperature 0.95` / `top_p 0.95`, an anti-cliché list, and an
  explicit "don't reuse these titles" list built from the session's own previous
  round plus a process-wide memory of the last ~120 titles handed out. The
  offline fallback pools (16 Python / 12 SQL / 8 JS problems) rotate the same
  way, so back-to-back offline candidates still differ.
  Code is statically AI-reviewed (there is deliberately no "Run"). Falls back
  to a curated per-language question pool + neutral scoring with no key / no
  network.
* Model defaults (`groq/compound`, `gemini-3.6-flash`,
  `openai/gpt-oss-20b`) are tuned for the keys in `.env`; override per
  `.env.example`.
