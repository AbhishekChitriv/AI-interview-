import os
import json
import sys
import logging
from typing import List, Dict, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import edge_tts
from dotenv import load_dotenv

_ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if _ROOT_DIR not in sys.path:
    sys.path.insert(0, _ROOT_DIR)

_INTERVIEW_AGENT_DIR = os.path.join(_ROOT_DIR, "interview_agent")
if _INTERVIEW_AGENT_DIR not in sys.path:
    sys.path.insert(0, _INTERVIEW_AGENT_DIR)

try:
    from agents.question import generate_interview_questions
    from agents.evaluation import evaluate_answer, generate_final_report
    from services.resume import extract_text_from_file, parse_resume_details
    from services.jd import parse_jd_and_match
    _INTERVIEW_AVAILABLE = True
except Exception as _import_err:
    logging.warning(f"Interview agent modules could not be loaded: {_import_err}")
    _INTERVIEW_AVAILABLE = False
# ───────────────────────────────────────────────────────────────────────────

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AIInterviewPlatform")

app = FastAPI(title="Eliora - AI Interview Platform")

# CORS middleware for local development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TTSRequest(BaseModel):
    text: str
    voice: str = "en-US-AriaNeural"


@app.post("/api/tts")
async def tts_endpoint(req: TTSRequest):
    logger.info(f"TTS request for text length {len(req.text)} with voice {req.voice}")
    try:
        communicate = edge_tts.Communicate(req.text, req.voice)

        async def audio_generator():
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]

        return StreamingResponse(audio_generator(), media_type="audio/mpeg")
    except Exception as e:
        logger.error(f"TTS Synthesis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")


# ─── Interview Agent API Routes ─────────────────────────────────────────────

class InterviewEvaluateRequest(BaseModel):
    question: str
    category: str = "Technical"
    candidate_answer: str
    job_title: str = "Software Engineer"
    groq_api_key: Optional[str] = None

class InterviewReportRequest(BaseModel):
    evaluations: List[Dict]
    candidate_name: str = "Candidate"
    job_title: str = "Software Engineer"
    groq_api_key: Optional[str] = None


@app.post("/api/resume/parse")
async def parse_resume_endpoint(
    resume_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    groq_api_key: Optional[str] = Form(None),
):
    """
    Parse uploaded resume document (PDF, TXT) or raw text and return structured details.
    """
    if not _INTERVIEW_AVAILABLE:
        raise HTTPException(status_code=503, detail="Interview agent modules are not available.")

    effective_key = (groq_api_key or os.environ.get("GROQ_API_KEY") or "").strip()

    raw_text = (resume_text or "").strip()
    if not raw_text and resume_file is not None:
        import tempfile
        contents = await resume_file.read()
        suffix = os.path.splitext(resume_file.filename or "")[1] or ".pdf"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        try:
            raw_text = extract_text_from_file(tmp_path, resume_file.filename or "resume.pdf")
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass

    if not raw_text:
        raise HTTPException(status_code=400, detail="Please provide a valid resume file or text.")

    result = parse_resume_details(raw_text, api_key=effective_key)
    return result


@app.post("/api/jd/parse")
async def parse_jd_endpoint(
    jd_file: Optional[UploadFile] = File(None),
    jd_text: Optional[str] = Form(None),
    resume_text: Optional[str] = Form(None),
    groq_api_key: Optional[str] = Form(None),
):
    """
    Parse Job Description and compute match analysis against candidate resume.
    """
    if not _INTERVIEW_AVAILABLE:
        raise HTTPException(status_code=503, detail="Interview agent modules are not available.")

    effective_key = (groq_api_key or os.environ.get("GROQ_API_KEY") or "").strip()

    raw_jd = (jd_text or "").strip()
    if not raw_jd and jd_file is not None:
        import tempfile
        contents = await jd_file.read()
        suffix = os.path.splitext(jd_file.filename or "")[1] or ".pdf"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        try:
            raw_jd = extract_text_from_file(tmp_path, jd_file.filename or "jd.pdf")
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass

    if not raw_jd:
        raise HTTPException(status_code=400, detail="Please provide a valid Job Description file or text.")

    result = parse_jd_and_match(raw_jd, resume_text=resume_text or "", api_key=effective_key)
    return result


@app.post("/api/interview/start")
async def interview_start(
    resume_file: Optional[UploadFile] = File(None),
    jd_file: Optional[UploadFile] = File(None),
    groq_api_key: Optional[str] = Form(None),
    resume_text: Optional[str] = Form(None),
    jd_text: Optional[str] = Form(None),
    num_questions: int = Form(10),
):
    """
    Generate tailored interview questions dynamically from Candidate Resume & Job Description.
    """
    if not _INTERVIEW_AVAILABLE:
        raise HTTPException(status_code=503, detail="Interview agent modules are not available.")

    effective_key = (groq_api_key or os.environ.get("GROQ_API_KEY") or "").strip()

    raw_resume = (resume_text or "").strip()
    if not raw_resume and resume_file is not None:
        import tempfile
        contents = await resume_file.read()
        suffix = os.path.splitext(resume_file.filename or "")[1] or ".pdf"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        try:
            raw_resume = extract_text_from_file(tmp_path, resume_file.filename or "resume.pdf")
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass

    raw_jd = (jd_text or "").strip()
    if not raw_jd and jd_file is not None:
        import tempfile
        contents = await jd_file.read()
        suffix = os.path.splitext(jd_file.filename or "")[1] or ".pdf"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        try:
            raw_jd = extract_text_from_file(tmp_path, jd_file.filename or "jd.pdf")
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass

    if not raw_resume:
        raw_resume = "Software Engineer with generic programming experience."

    try:
        result = generate_interview_questions(
            resume=raw_resume,
            job_description=raw_jd,
            num_questions=num_questions,
            api_key=effective_key
        )
        return result
    except Exception as e:
        logger.error(f"Interview question generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/interview/evaluate")
async def interview_evaluate(req: InterviewEvaluateRequest):
    """
    Evaluate candidate response across 5 core dimensions.
    """
    if not _INTERVIEW_AVAILABLE:
        raise HTTPException(status_code=503, detail="Interview agent modules are not available.")

    effective_key = (req.groq_api_key or os.environ.get("GROQ_API_KEY") or "").strip()

    try:
        result = evaluate_answer(
            question=req.question,
            candidate_answer=req.candidate_answer,
            category=req.category,
            job_title=req.job_title,
            api_key=effective_key,
        )
        return result
    except Exception as e:
        logger.error(f"Interview evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/interview/report")
async def interview_report(req: InterviewReportRequest):
    """
    Generate a final comprehensive interview report from all evaluations.
    """
    if not _INTERVIEW_AVAILABLE:
        raise HTTPException(status_code=503, detail="Interview agent modules are not available.")

    effective_key = (req.groq_api_key or os.environ.get("GROQ_API_KEY") or "").strip()

    try:
        report = generate_final_report(
            evaluations=req.evaluations,
            candidate_name=req.candidate_name,
            job_title=req.job_title,
            api_key=effective_key,
        )
        return report
    except Exception as e:
        logger.error(f"Interview report generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─────────────────────────────────────────────────────────────────────────────

HISTORY_DIR = os.path.join(os.path.dirname(os.path.dirname(_ROOT_DIR)), "Interview_Recordings_History")
os.makedirs(HISTORY_DIR, exist_ok=True)

@app.get("/api/history")
async def get_history():
    history_list = []
    if os.path.exists(HISTORY_DIR):
        for filename in os.listdir(HISTORY_DIR):
            if filename.endswith(".json"):
                filepath = os.path.join(HISTORY_DIR, filename)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        history_list.append(data)
                except Exception as e:
                    logger.error(f"Error reading history file {filename}: {e}")
    # Sort history by ID descending
    history_list.sort(key=lambda x: x.get("id", ""), reverse=True)
    return history_list

@app.post("/api/history")
async def save_history(
    sessionData: str = Form(...),
    videoBlob: Optional[UploadFile] = File(None)
):
    try:
        data = json.loads(sessionData)
        session_id = data.get("id", f"session_{int(datetime.now().timestamp() * 1000)}")

        # Save video if present
        if videoBlob:
            video_path = os.path.join(HISTORY_DIR, f"{session_id}.webm")
            content = await videoBlob.read()
            with open(video_path, "wb") as f:
                f.write(content)
            data["videoBlobUrl"] = f"/api/history/video/{session_id}"

        # Save JSON data
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


# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)

@app.get("/")
async def read_index():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            html = f.read()
        return HTMLResponse(content=html, headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        })
    return {"message": "Server is running."}

@app.get("/static/app.js")
async def read_app_js():
    js_path = os.path.join(static_dir, "app.js")
    if os.path.exists(js_path):
        return FileResponse(js_path, media_type="application/javascript", headers={
            "Cache-Control": "no-cache, no-store, must-revalidate"
        })
    raise HTTPException(status_code=404, detail="app.js not found")

app.mount("/static", StaticFiles(directory=static_dir), name="static")

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8001, reload=True)
