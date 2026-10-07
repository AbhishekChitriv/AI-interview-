# Aptitude & Reasoning Round — integration bundle

Self-contained extract of the aptitude round from *AI Interview Live*, ready to
drop into your major project.

**What it does:** a timed, AI-proctored, 20-question MCQ test
(10 Quantitative Aptitude + 10 Logical Reasoning, 3 Easy / 4 Moderate / 3 Hard
each), auto-scored with a category + difficulty breakdown, verdict, and a
question-by-question worked-solution review.

Questions come from an LLM (Groq, `llama-3.1-8b-instant`). **If no API key is set
or the call fails, it automatically serves a curated 40-question bank** — so the
round works with zero configuration.

```
aptitude_round/
├── backend/
│   ├── aptitude_reasoning.py   core: question generation + scoring + fallback bank
│   ├── llm.py                  Groq client (OpenAI-compatible)
│   ├── routes.py               FastAPI APIRouter with the 2 endpoints
│   ├── __init__.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── aptitude.html           HTML fragments (nav button, tab view, rules modal)
    ├── aptitude.js             the whole frontend engine (timer, proctoring, scoring UI)
    └── aptitude.css            styles (with fallback theme tokens)
```

## Backend integration

1. Copy `backend/` into your project (e.g. as `aptitude_round/`).
2. `pip install -r aptitude_round/backend/requirements.txt`
   (skip anything you already have — you likely have `fastapi`, `pydantic`).
3. (Optional) put `GROQ_API_KEY` in your `.env`. See `.env.example`.
4. Mount the router on your FastAPI app:

   ```python
   from aptitude_round.backend import aptitude_router
   app.include_router(aptitude_router)
   ```

   This adds:
   | Method | Path | Purpose |
   |---|---|---|
   | POST | `/api/assessment/generate` | returns 20 questions |
   | POST | `/api/assessment/evaluate` | returns score + breakdown + review |

   If those paths clash with yours, pass a prefix:
   `app.include_router(aptitude_router, prefix="/aptitude")` and update the two
   `fetch()` URLs in `aptitude.js` (`startAssessment`, `submitAssessment`).

The module has **no dependency on the rest of the interview app** — only
`aptitude_reasoning.py` ↔ `llm.py`. Swap `llm.py` for your own client if you
don't use Groq; `generate_aptitude_reasoning_questions` just needs an object with
`.chat.completions.create(...)` returning JSON.

## Frontend integration

1. Copy `aptitude.css` and `aptitude.js` into your static assets; link them:

   ```html
   <link rel="stylesheet" href="/static/aptitude.css">
   <!-- ... -->
   <script src="/static/aptitude.js"></script>   <!-- after the HTML fragments -->
   ```

2. Paste the three fragments from `aptitude.html` into your page:
   - **nav button** → into your tab bar
   - **tab view** (`<section id="view-assessment" class="view-tab">`) → with your other tab panels
   - **rules modal** → near the end of `<body>`

3. Routing. The nav button calls `switchNavTab('assessment')`. In your tab
   switcher, (a) show `#view-assessment` and call `renderAssessmentPanels()`, and
   (b) guard against leaving mid-test:

   ```js
   if (state.currentTab === 'assessment' && tabName !== 'assessment'
       && typeof assessmentState !== 'undefined' && assessmentState.phase === 'live') {
       if (!confirm('Leaving this page will end your assessment. Continue?')) return;
       stopAssessmentTimer(); stopAssessmentProctoring();
       assessmentState.phase = 'intro'; renderAssessmentPanels();
   }
   ```

4. `state` shim. `aptitude.js` reads `state.jobTitle`, `state.settings.groqKey`,
   `state.candidateProfile`, `state.candidateName`. The top of the file creates a
   safe `window.state` if you don't have one; if you do, delete that shim and
   make sure those paths exist.

### Proctoring notes

- AI proctoring (face / gaze / phone / extra-person detection) loads **MediaPipe
  Tasks-Vision from a CDN** (`cdn.jsdelivr.net`, `storage.googleapis.com`).
  If those are blocked, the round still runs and degrades to **tab-switch
  detection only** — no code changes needed.
- Camera access is requested when a test starts. On denial the test proceeds
  with a compliance warning.
- The floating proctor cam is drag-only and never intercepts button clicks.

## Quick local test

```bash
cd aptitude_round
python -c "from fastapi import FastAPI; from fastapi.testclient import TestClient; \
from backend import aptitude_router; a=FastAPI(); a.include_router(aptitude_router); \
c=TestClient(a); print(c.post('/api/assessment/generate',json={}).json()['total_questions'])"
# -> 20
```
