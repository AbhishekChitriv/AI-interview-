"""
JobJugad - Candidate Dashboard (standalone)
============================================
A trimmed-down server that only powers the Candidate Dashboard:
 - Interview session history (list / save / video playback)
 - Score stats + trend chart
 - Recorded interview video player
 - "Open recordings folder" helper

Run:  python app.py     (or)     uvicorn app:app --reload --port 8000
Then open http://127.0.0.1:8000
"""

import os
import json
import logging
import platform
import subprocess
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DashboardServer")

_ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(_ROOT_DIR, "static")

def _get_desktop_history_dir() -> str:
    home = os.path.expanduser("~")
    onedrive_desktop = os.path.join(home, "OneDrive", "Desktop")
    desktop = onedrive_desktop if os.path.exists(onedrive_desktop) else os.path.join(home, "Desktop")
    history_dir = os.path.join(desktop, "Interview Recordings")
    os.makedirs(history_dir, exist_ok=True)

    # Migrate any legacy recordings from local folder to Desktop folder
    legacy_dir = os.path.join(_ROOT_DIR, "Interview_Recordings_History")
    if os.path.exists(legacy_dir):
        import shutil
        for filename in os.listdir(legacy_dir):
            src_file = os.path.join(legacy_dir, filename)
            if os.path.isfile(src_file):
                dest_file = os.path.join(history_dir, filename)
                if not os.path.exists(dest_file):
                    try:
                        shutil.copy2(src_file, dest_file)
                    except Exception:
                        pass
    return history_dir

HISTORY_DIR = _get_desktop_history_dir()
os.makedirs(STATIC_DIR, exist_ok=True)

app = FastAPI(title="JobJugad - Candidate Dashboard")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Interview History API ──────────────────────────────────────────────────
@app.get("/api/history")
async def get_history():
    history_list = []
    if os.path.exists(HISTORY_DIR):
        for filename in os.listdir(HISTORY_DIR):
            if filename.endswith(".json"):
                filepath = os.path.join(HISTORY_DIR, filename)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        history_list.append(json.load(f))
                except Exception as e:
                    logger.error(f"Error reading history file {filename}: {e}")
    history_list.sort(key=lambda x: x.get("id", ""), reverse=True)
    return history_list


@app.post("/api/history")
async def save_history(
    sessionData: str = Form(...),
    videoBlob: Optional[UploadFile] = File(None),
):
    try:
        data = json.loads(sessionData)
        session_id = data.get("id", f"session_{int(datetime.now().timestamp() * 1000)}")

        if videoBlob:
            video_path = os.path.join(HISTORY_DIR, f"{session_id}.webm")
            content = await videoBlob.read()
            with open(video_path, "wb") as f:
                f.write(content)
            data["videoBlobUrl"] = f"/api/history/video/{session_id}"

        json_path = os.path.join(HISTORY_DIR, f"{session_id}.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)

        return {"status": "success", "message": "History saved."}
    except Exception as e:
        logger.error(f"Error saving history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history/video/{session_id}")
async def get_video(session_id: str):
    video_path = os.path.join(HISTORY_DIR, f"{session_id}.webm")
    if os.path.exists(video_path):
        return FileResponse(video_path, media_type="video/webm")
    raise HTTPException(status_code=404, detail="Video not found")


@app.get("/api/open-history-folder")
async def open_history_folder():
    try:
        if platform.system() == "Windows":
            os.startfile(HISTORY_DIR)  # type: ignore[attr-defined]
        elif platform.system() == "Darwin":
            subprocess.Popen(["open", HISTORY_DIR])
        else:
            subprocess.Popen(["xdg-open", HISTORY_DIR])
        return {"status": "success", "message": "Folder opened"}
    except Exception as e:
        logger.error(f"Error opening folder: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Static frontend ───────────────────────────────────────────────────────
@app.get("/")
async def read_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            html = f.read()
        return HTMLResponse(content=html, headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        })
    return {"message": "Dashboard server is running."}


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


if __name__ == "__main__":
    import uvicorn

    # Run from the script's own directory so static/ and the history folder
    # always resolve, regardless of where `python app.py` was launched from.
    os.chdir(_ROOT_DIR)

    host, port = "127.0.0.1", 8000
    print(f"\n  Candidate Dashboard running at  http://{host}:{port}\n")

    # Pass the app object directly (no import string, no reloader subprocess)
    # so startup never depends on the current working directory.
    uvicorn.run(app, host=host, port=port)
