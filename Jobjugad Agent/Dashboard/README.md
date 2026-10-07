# JobJugad — Candidate Dashboard (standalone)

A self-contained extract of **only the Dashboard portion** of the AI HR Interview
Platform. Same UI, same behaviour — none of the interview / STT / TTS / resume /
JD / coach / proctoring code.

## What it does
- Interview session **stats** (count, average score, highest score, top role)
- **Score trend** line chart (Chart.js)
- **Assessment History** modal with search
- Per-session **printable performance report** (opens in a new tab)
- Per-session **recorded video** player (`.webm`)
- "Open Recordings Folder" shortcut

## Run

```bat
run.bat
```

or manually:

```bat
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Then open <http://127.0.0.1:8000>.

## Files

| Path | Purpose |
|------|---------|
| `app.py` | Minimal FastAPI server — history API + static hosting |
| `static/index.html` | Dashboard markup |
| `static/style.css` | Full platform stylesheet (unchanged, for identical look) |
| `static/app.js` | Dashboard-only frontend logic |
| `static/avatar/female_recruiter.jpg` | AI interviewer image |
| `Interview_Recordings_History/` | Session data (`*.json` + `*.webm`) read/written by the server |

## Data format

Each interview session is one `Interview_Recordings_History/<id>.json` file
(optionally paired with `<id>.webm`). New sessions can be added by `POST /api/history`
(`sessionData` form field + optional `videoBlob` file), exactly as the full platform does.
