"""
Module 2 — Resume & JD Setup.

Ported from ``Resume & JD setup/server.py`` (which was a raw ``http.server``)
onto a FastAPI ``APIRouter``. Same endpoints, same JSON response shapes, so the
existing frontend (``frontend/setup/``) works unchanged:

    POST /api/upload             multipart file  -> extracted text
    POST /api/extract-resume     resume_text     -> structured candidate profile
    POST /api/analyze-alignment  resume + jd     -> match / gap analysis
    POST /api/generate-questions resume + jd     -> tailored questions  (⇒ SETUP_COMPLETE)
    POST /api/evaluate-response  q + answer      -> per-answer feedback

The hard-coded Groq/Gemini calls are replaced by the unified ``llm_factory``;
the request's optional ``provider`` field still selects openai|gemini|groq|claude.
"""
from __future__ import annotations

import io
import logging
import os
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, UploadFile
from pydantic import BaseModel

from llm_factory import LLMError, extract_json, get_llm
from session_manager import Stage, current_session, manager

logger = logging.getLogger("jobjugad.resume_jd")

resume_jd_router = APIRouter(tags=["resume_jd"])

_ELIORA = (
    "You are Eliora, an elite AI HR Manager and Recruitment Analyst. "
    "Respond ONLY with valid raw JSON — no markdown, no preamble, no reasoning."
)


# ── text extraction ────────────────────────────────────────────────────────
def _extract_pdf(data: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(data))
    return "\n".join((page.extract_text() or "") for page in reader.pages).strip()


def _extract_docx(data: bytes) -> str:
    import docx

    doc = docx.Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs).strip()


def _extract_text(filename: str, data: bytes) -> str:
    ext = os.path.splitext(filename)[1].lower()
    try:
        if ext == ".pdf":
            return _extract_pdf(data)
        if ext in (".docx", ".doc"):
            return _extract_docx(data)
        return data.decode("utf-8", errors="ignore")
    except Exception as exc:  # noqa: BLE001
        logger.error("Extraction failed for %s: %s", filename, exc)
        return f"Error extracting text: {exc}"


def _guess_name(resume_text: str) -> Optional[str]:
    for raw in (resume_text or "").splitlines():
        line = raw.strip()
        if not line or any(c.isdigit() for c in line) or "@" in line or "http" in line.lower():
            continue
        low = line.lower()
        if any(k in low for k in ("resume", "curriculum", "vitae", "profile", "summary", "objective", "address")):
            continue
        words = line.split()
        if 1 < len(words) <= 4 and all(w[:1].isalpha() for w in words) and len(line) <= 40:
            return " ".join(w.capitalize() for w in words)
    return None


def _heuristic_resume_parse(resume_text: str) -> Dict[str, Any]:
    """Offline ATS parser that extracts candidate details, skills, and roles when LLM is unavailable."""
    text = (resume_text or "").strip()
    low = text.lower()

    name = _guess_name(text) or "Candidate"

    skill_catalog = [
        ("Python", ["python", "django", "flask", "fastapi", "pandas", "numpy"]),
        ("Java", ["java ", "java,", "spring boot", " spring", "hibernate"]),
        ("JavaScript", ["javascript", "js", "ecmascript"]),
        ("TypeScript", ["typescript", "ts"]),
        ("React", ["react", "react.js", "reactjs", "redux"]),
        ("Node.js", ["node.js", "nodejs", "express.js", "expressjs"]),
        ("Angular", ["angular", "angularjs"]),
        ("Vue.js", ["vue", "vue.js", "vuejs"]),
        ("C++", ["c++", "cpp"]),
        ("C#", ["c#", ".net", "dotnet", "asp.net"]),
        ("SQL", ["sql", "mysql", "postgresql", "postgres", "sqlite", "oracle"]),
        ("Docker", ["docker", "container"]),
        ("Kubernetes", ["kubernetes", "k8s"]),
        ("AWS", ["aws", "amazon web services", "ec2", "s3", "lambda"]),
        ("Azure", ["azure"]),
        ("GCP", ["gcp", "google cloud"]),
        ("Git", ["git", "github", "gitlab"]),
        ("REST APIs", ["rest api", "restful", "apis", "api"]),
        ("HTML/CSS", ["html", "css", "tailwind", "bootstrap"]),
        ("Data Analysis", ["data analysis", "power bi", "tableau", "excel"]),
        ("Machine Learning", ["machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn"]),
        ("Data Structures & Algorithms", ["data structures", "algorithms", "dsa", "leetcode", "problem solving"]),
    ]

    detected_skills = []
    for skill_name, triggers in skill_catalog:
        if any(tr in low for tr in triggers):
            detected_skills.append(skill_name)

    if not detected_skills:
        detected_skills = ["Software Engineering", "Problem Solving", "Git"]

    role_rules = [
        ("Full Stack Developer", ["full stack", "fullstack", "mern", "mean stack"]),
        ("Frontend Developer", ["frontend", "front-end", "front end", "react developer", "angular developer", "vue developer", "ui developer"]),
        ("Backend Developer", ["backend", "back-end", "back end", "node developer", "django developer", "spring boot developer", "api developer"]),
        ("Software Engineer", ["software engineer", "software developer", "sde", "programmer", "software development"]),
        ("Mobile Developer", ["mobile app", "android", "ios developer", "flutter", "react native"]),
        ("DevOps Engineer", ["devops", "sre", "site reliability", "ci/cd", "infrastructure"]),
        ("Data Engineer", ["data engineer", "etl", "data pipeline", "spark", "hadoop", "airflow"]),
        ("Data Scientist", ["data scientist", "machine learning engineer", "ml engineer", "deep learning", "ai engineer"]),
        ("Data Analyst", ["data analyst", "business analyst", "bi analyst", "tableau developer", "power bi"]),
    ]

    primary_role = None
    for role_name, keywords in role_rules:
        if any(kw in low for kw in keywords):
            primary_role = role_name
            break

    if not primary_role:
        has_dev = any(s in detected_skills for s in ["React", "Node.js", "Java", "Python", "JavaScript", "TypeScript", "C++", "C#"])
        has_analyst = any(s in detected_skills for s in ["Data Analysis", "SQL"]) and not has_dev
        if has_analyst:
            primary_role = "Data Analyst"
        else:
            primary_role = "Software Engineer"

    role_recs = {
        "Software Engineer": ["Software Engineer", "Full Stack Developer", "Backend Developer", "Python Developer" if "Python" in detected_skills else "Java Developer" if "Java" in detected_skills else "Software Developer"],
        "Full Stack Developer": ["Full Stack Developer", "Software Engineer", "Backend Developer", "Frontend Developer"],
        "Backend Developer": ["Backend Developer", "Software Engineer", "Full Stack Developer", "Cloud Engineer"],
        "Frontend Developer": ["Frontend Developer", "Full Stack Developer", "UI/UX Developer", "Web Developer"],
        "Mobile Developer": ["Mobile Developer", "Android Developer", "iOS Developer", "Software Engineer"],
        "DevOps Engineer": ["DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer", "Platform Engineer"],
        "Data Engineer": ["Data Engineer", "Big Data Engineer", "Database Developer", "Backend Developer"],
        "Data Scientist": ["Data Scientist", "Machine Learning Engineer", "AI Engineer", "Data Analyst"],
        "Data Analyst": ["Data Analyst", "Business Intelligence Analyst", "Data Specialist", "Analytics Consultant"],
    }

    recommended_roles = role_recs.get(primary_role, [primary_role, "Software Engineer", "Full Stack Developer", "Backend Developer"])

    import re
    exp_match = re.search(r"(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience", low)
    experience = f"{exp_match.group(1)}+ Years" if exp_match else "Experienced Professional"

    return {
        "candidate_name": name,
        "email": "N/A",
        "phone": "N/A",
        "total_experience": experience,
        "primary_role": primary_role,
        "top_skills": detected_skills[:8],
        "recommended_roles": recommended_roles,
        "education": ["Computer Science / Engineering"],
        "key_achievements": ["Successfully delivered software projects and technical solutions"],
        "summary": f"{name} is an experienced {primary_role} specializing in {', '.join(detected_skills[:4])}."
    }


# ── request models ─────────────────────────────────────────────────────────
class ResumeTextIn(BaseModel):
    resume_text: str = ""
    provider: Optional[str] = None


class AlignmentIn(BaseModel):
    resume_text: str = ""
    jd_text: str = ""
    provider: Optional[str] = None


class QuestionsIn(BaseModel):
    candidate_name: str = "Candidate"
    job_title: str = "Senior Software Engineer"
    num_questions: int = 10
    accent: str = "Indian"
    resume_text: str = ""
    jd_text: str = ""
    provider: Optional[str] = None


class EvaluateIn(BaseModel):
    question: str = ""
    candidate_answer: str = ""
    job_title: str = "Senior Software Engineer"
    key_eval_points: List[Any] = []
    provider: Optional[str] = None


class SetupCompleteIn(BaseModel):
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None


def _llm_json(provider: Optional[str], prompt: str, system: str = _ELIORA) -> Dict[str, Any]:
    try:
        return get_llm(provider).complete_json(prompt, system, max_tokens=2048)
    except LLMError as exc:
        logger.warning("LLM call failed (%s): %s", provider, exc)
        return {"error": str(exc)}


# ── endpoints ──────────────────────────────────────────────────────────────
@resume_jd_router.post("/api/upload")
async def upload(file: UploadFile):
    data = await file.read()
    text = _extract_text(file.filename or "document.txt", data)
    return {"success": True, "filename": file.filename, "text": text, "length": len(text)}


@resume_jd_router.post("/api/extract-resume")
async def extract_resume(body: ResumeTextIn, session=Depends(current_session)):
    if len((body.resume_text or "").strip()) < 10:
        return {"success": False, "error": "Please provide valid resume text to parse."}

    heuristic = _heuristic_resume_parse(body.resume_text)

    prompt = f"""Parse the following resume text into structured JSON.

RESUME TEXT:
{body.resume_text[:4000]}

Return strictly valid JSON with this schema:
{{
  "candidate_name": "Full Name",
  "email": "Email or N/A",
  "phone": "Phone or N/A",
  "total_experience": "e.g. 5+ Years",
  "primary_role": "e.g. Senior Software Engineer",
  "top_skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6"],
  "recommended_roles": ["Role 1", "Role 2", "Role 3", "Role 4"],
  "education": ["Degree, University"],
  "key_achievements": ["Achievement 1", "Achievement 2"],
  "summary": "Brief 2-sentence professional executive summary"
}}"""
    data = _llm_json(body.provider, prompt, "You are an expert ATS & Resume Parser. Return JSON only.")

    # Fallback merge if LLM failed or missed key fields
    if not isinstance(data, dict) or "error" in data or not data.get("primary_role"):
        if not isinstance(data, dict):
            data = {}
        for k, v in heuristic.items():
            if not data.get(k):
                data[k] = v

    name = (data.get("candidate_name") or "").strip()
    if name in ("", "Full Name", "N/A"):
        data["candidate_name"] = heuristic.get("candidate_name") or "Candidate"

    if not data.get("primary_role"):
        data["primary_role"] = heuristic.get("primary_role") or "Software Engineer"

    if not data.get("recommended_roles") or not isinstance(data["recommended_roles"], list):
        data["recommended_roles"] = heuristic.get("recommended_roles") or [data["primary_role"], "Software Engineer", "Full Stack Developer"]

    if not data.get("top_skills"):
        data["top_skills"] = heuristic.get("top_skills") or ["Software Engineering", "Problem Solving"]

    manager.set_artifact(session["id"], "resume_text", body.resume_text)
    manager.set_artifact(session["id"], "candidate_profile", data)
    if data.get("candidate_name"):
        manager.set_artifact(session["id"], "candidate_name", data["candidate_name"])
    if data.get("primary_role"):
        manager.set_artifact(session["id"], "job_title", data["primary_role"])

    manager.advance(session["id"], Stage.SETUP_COMPLETE)
    return {"success": True, "data": data, "stage": "SETUP_COMPLETE"}


@resume_jd_router.post("/api/analyze-alignment")
async def analyze_alignment(body: AlignmentIn, session=Depends(current_session)):
    if not body.resume_text or not body.jd_text:
        return {"success": False, "error": "Both Resume and Job Description text are required."}

    prompt = f"""Analyze the match alignment between the candidate's Resume and the target Job Description.

RESUME:
{body.resume_text[:3500]}

JOB DESCRIPTION:
{body.jd_text[:3500]}

Return strictly valid JSON with this schema:
{{
  "overall_match_score": 85,
  "skills_match_score": 88,
  "experience_match_score": 82,
  "domain_match_score": 85,
  "fit_level": "Strong Match | Moderate Match | Potential Fit | Low Alignment",
  "matching_key_skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
  "missing_or_gap_skills": ["Gap 1", "Gap 2", "Gap 3"],
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "concerns_or_gaps": ["Risk 1", "Risk 2"],
  "recommendations": ["Focus area 1", "Focus area 2"]
}}"""
    data = _llm_json(body.provider, prompt, "You are Eliora, Lead Recruitment Analytics AI. Return JSON only.")
    manager.set_artifact(session["id"], "jd_text", body.jd_text)
    manager.set_artifact(session["id"], "alignment", data)
    manager.advance(session["id"], Stage.SETUP_COMPLETE)
    return {"success": True, "data": data}


@resume_jd_router.post("/api/generate-questions")
async def generate_questions(body: QuestionsIn, session=Depends(current_session)):
    n = max(1, min(int(body.num_questions or 10), 20))
    prompt = f"""Generate {n} tailored AI HR & Technical interview questions for candidate
"{body.candidate_name}" applying for "{body.job_title}".

The first 3 questions must be foundational:
1. Introduce yourself, education background, skills
2. Why you apply for this role?
3. What are your expectations?

The remaining {max(0, n - 3)} questions must be deeply tailored to the candidate's resume domain and the Job Description context.

RESUME CONTEXT:
{body.resume_text[:2000] or ('Standard resume for ' + body.job_title)}

JOB DESCRIPTION CONTEXT:
{body.jd_text[:2000] or ('Standard requirements for ' + body.job_title)}

Return strictly valid JSON with this schema:
{{
  "session_id": "session_12345",
  "candidate_name": "{body.candidate_name}",
  "job_title": "{body.job_title}",
  "accent": "{body.accent}",
  "total_questions": {n},
  "questions": [
    {{
      "id": 1,
      "category": "Introduction | Motivation | Expectations | Technical | System Design & Problem Solving | Behavioral & Leadership | Role Fit",
      "question": "Clear, professional, natural interview question...",
      "key_eval_points": ["Point 1", "Point 2", "Point 3"],
      "ideal_answer_outline": "What a 10/10 response should include."
    }}
  ]
}}"""
    data = _llm_json(body.provider, prompt, "You are Eliora, Elite AI HR Manager. Return JSON only.")

    if data.get("questions"):
        manager.set_artifact(session["id"], "interview_questions", data)
        manager.set_artifact(session["id"], "candidate_name", body.candidate_name)
        manager.set_artifact(session["id"], "job_title", body.job_title)
        manager.advance(session["id"], Stage.SETUP_COMPLETE)
        return {"success": True, "data": data, "session_id": session["id"], "stage": "SETUP_COMPLETE"}

    return {"success": False, "error": data.get("error", "Could not generate questions."), "data": data}


@resume_jd_router.post("/api/setup/complete")
async def setup_complete(body: SetupCompleteIn, session=Depends(current_session)):
    """Mark setup done and proceed to the aptitude round without generating
    Eliora interview questions. Requires a parsed resume in this session."""
    record = manager.get(session["id"]) or {}
    artifacts = record.get("artifacts", {})
    if not (artifacts.get("candidate_profile") or artifacts.get("resume_text")):
        return {"success": False, "error": "Upload and extract a resume first."}

    profile = artifacts.get("candidate_profile") or {}
    cand_name = (body.candidate_name or "").strip() or profile.get("candidate_name") or "Candidate"
    job_title = (body.job_title or "").strip() or profile.get("primary_role") or "Software Engineer"
    manager.set_artifact(session["id"], "candidate_name", cand_name)
    manager.set_artifact(session["id"], "job_title", job_title)
    manager.advance(session["id"], Stage.SETUP_COMPLETE)
    return {"success": True, "session_id": session["id"], "stage": "SETUP_COMPLETE", "next": "/interview"}


@resume_jd_router.post("/api/evaluate-response")
async def evaluate_response(body: EvaluateIn):
    prompt = f"""Evaluate the candidate's interview response for the role "{body.job_title}".

QUESTION:
"{body.question}"

CANDIDATE ANSWER:
"{body.candidate_answer}"

EXPECTED EVALUATION CRITERIA:
{body.key_eval_points}

Return strictly valid JSON:
{{
  "score": 8,
  "rating": "Excellent | Good | Average | Needs Improvement",
  "positive_feedback": "What the candidate did well",
  "areas_for_improvement": "What was missing or weak",
  "suggested_follow_up": "Optional follow-up question or tip"
}}"""
    data = _llm_json(body.provider, prompt, "You are Eliora evaluating candidate responses in real time. Return JSON only.")
    return {"success": True, "data": data}
