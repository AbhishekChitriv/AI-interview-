# Coding Round — Standalone

A self-contained extract of the **Coding Round** feature from the
`AI_Interview_Live` platform. It is just the coding panel: a setup form,
the IDE-style live coding screen (Monaco editor, AI proctoring, timer),
and the AI-reviewed results screen.

## Run

```bash
pip install -r requirements.txt
python app.py
```

Then open **http://127.0.0.1:8010**

(Or just double-click `start.bat` on Windows.)

## Configuration

`.env` holds the Groq credentials used to generate and grade questions:

```
GROQ_API_KEY=gsk_...
GROQ_MODEL=groq/compound-mini
```

You can also paste a Groq key directly into the setup form. If no key is
available (or the call fails), the round falls back to a built-in offline
question pool and neutral scoring.

## Files

| File | Purpose |
|------|---------|
| `app.py` | FastAPI server — serves the page and 2 API routes |
| `coding_round.py` | Question generation + LLM code-review grading (copied unchanged) |
| `llm.py` | Groq/OpenAI-compatible client factory (copied unchanged) |
| `static/index.html` | The coding panel markup |
| `static/app.js` | Coding round logic, Monaco editor, proctoring engine |
| `static/style.css` | Full stylesheet (copied unchanged from the original) |

## API

### `POST /api/coding/generate`
```json
{ "resume_text": "...", "jd_text": "...", "target_role": "Data Analyst",
  "candidate_name": "Alex", "groq_api_key": null }
```
Returns 5 questions (2 Easy, 2 Moderate, 1 Hard) in the role-appropriate language.

### `POST /api/coding/evaluate`
```json
{ "questions": [...], "submissions": { "1": "def ..." },
  "time_taken_seconds": 600, "groq_api_key": null }
```
Returns per-question verdicts, feedback, difficulty breakdown, and an overall score.
No code is executed — grading is a static AI code review.

## Notes

- The original app runs on port `8000`; this standalone uses `8010` so both
  can run at once.
- Proctoring (face/device detection) loads MediaPipe models from a CDN and
  needs camera permission + internet. It degrades gracefully to tab-switch
  detection only if unavailable.
