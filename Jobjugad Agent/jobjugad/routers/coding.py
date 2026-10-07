"""
Module 3.5 — Coding Round.

A hands-on, timed, webcam-proctored 5-question coding round (2 Easy, 2 Moderate,
1 Hard) extracted from *AI Interview Live*. Questions are generated from the
candidate's parsed resume + target role (Groq via ``modules.coding``) with a
curated fallback pool when there is no key / no network. Submitted code is
reviewed statically by the LLM — there is no execution environment.

    POST /api/coding/generate   -> 5 questions            (needs INTERVIEW_COMPLETE)
    POST /api/coding/evaluate   -> per-question review + score  (⇒ CODING_COMPLETE)

Sits between the aptitude round (``/interview``) and the performance report
(``/performance``) in the strict linear workflow.
"""
from __future__ import annotations

import json
import logging
import re
import sqlite3
import subprocess
import sys
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from config import settings
from modules.coding.coding_round import (
    _plan_summary,
    _resolve_language_plan,
    evaluate_coding_submission,
    generate_coding_questions,
)
from session_manager import Stage, current_session, manager

logger = logging.getLogger("jobjugad.coding")

coding_router = APIRouter(tags=["coding"])

# Roles the candidate can pick from in the coding-round intro screen. The
# detected résumé role is pre-selected; "Other…" lets them type a custom one.
ROLE_OPTIONS = [
    "Data Analyst",
    "Business Intelligence Analyst",
    "Data Engineer",
    "Data Scientist",
    "Machine Learning Engineer",
    "AI Engineer",
    "Backend Developer",
    "Frontend Developer",
    "Full Stack Developer",
    "Software Engineer",
    "Mobile Developer (Android)",
    "Mobile Developer (iOS)",
    "DevOps / SRE Engineer",
]


def _resume_context(artifacts: Dict[str, Any]) -> str:
    """Build the richest resume context Setup captured for this session.

    Combines the structured profile Eliora parsed (role, skills, experience,
    education, achievements) with the raw extracted resume text, so the coding
    round is generated from what the candidate actually put on their resume —
    not a generic role template.
    """
    raw = (artifacts.get("resume_text") or "").strip()
    profile = artifacts.get("candidate_profile") or {}

    lines: List[str] = []
    if profile.get("primary_role"):
        lines.append(f"Current / target role: {profile['primary_role']}")
    if profile.get("total_experience"):
        lines.append(f"Total experience: {profile['total_experience']}")
    if profile.get("top_skills"):
        lines.append("Key skills: " + ", ".join(str(s) for s in profile["top_skills"]))
    if profile.get("education"):
        lines.append("Education: " + "; ".join(str(e) for e in profile["education"]))
    if profile.get("key_achievements"):
        lines.append("Achievements: " + "; ".join(str(a) for a in profile["key_achievements"]))
    if profile.get("summary"):
        lines.append(f"Professional summary: {profile['summary']}")

    structured = "\n".join(lines)
    if raw and structured:
        return f"{structured}\n\n--- Full resume text ---\n{raw}"
    return raw or structured


def _target_role(body_role: Optional[str], artifacts: Dict[str, Any]) -> Optional[str]:
    profile = artifacts.get("candidate_profile") or {}
    return (
        (body_role or "").strip()
        or (artifacts.get("job_title") or "").strip()
        or (profile.get("primary_role") or "").strip()
        or None
    )


class CodingGenerateIn(BaseModel):
    target_role: Optional[str] = None
    candidate_name: str = "Candidate"
    resume_text: Optional[str] = None
    jd_text: Optional[str] = None
    groq_api_key: Optional[str] = None


class CodingEvaluateIn(BaseModel):
    questions: List[Dict] = Field(default_factory=list)
    submissions: Dict[str, Any] = Field(default_factory=dict)
    time_taken_seconds: int = 0
    groq_api_key: Optional[str] = None


class CodingRunIn(BaseModel):
    code: str
    language: str = "python"
    stdin: Optional[str] = None
    question_id: Optional[str] = None
    groq_api_key: Optional[str] = None


@coding_router.get("/api/coding/context")
async def coding_context(role: Optional[str] = None, session=Depends(current_session)):
    """Everything the coding-round intro screen needs: who the candidate is, the
    role detected from their résumé, the pickable role list, and a live preview
    of which languages a given ``role`` would be tested on.
    """
    record = manager.get(session["id"]) or {}
    artifacts = record.get("artifacts", {})
    profile = artifacts.get("candidate_profile") or {}

    detected_role = _target_role(None, artifacts)
    explicit = bool((role or "").strip())
    chosen_role = (role or "").strip() or detected_role
    resume_ctx = _resume_context(artifacts)
    jd_text = artifacts.get("jd_text") or ""
    skills = profile.get("top_skills") or []

    plan, primary, secondary, reason = _resolve_language_plan(
        resume_ctx, jd_text, chosen_role or "", role_is_explicit=explicit, skills=skills
    )

    return {
        "candidate_name": artifacts.get("candidate_name")
        or profile.get("candidate_name")
        or "Candidate",
        "detected_role": detected_role,
        "role_options": ROLE_OPTIONS,
        "has_resume": bool(resume_ctx),
        "resume_text": artifacts.get("resume_text") or "",
        "jd_text": artifacts.get("jd_text") or "",
        "skills": (profile.get("top_skills") or [])[:10],
        "plan": {
            "role": chosen_role,
            "languages": plan,
            "summary": _plan_summary(plan),
            "primary_language": primary,
            "secondary_language": secondary,
            "is_mixed": len(set(plan)) > 1,
            "reason": reason,
        },
    }


@coding_router.post("/api/coding/generate")
async def coding_generate(body: CodingGenerateIn, session=Depends(current_session)):
    record = manager.get(session["id"]) or {}
    if manager.stage_of(record) < Stage.INTERVIEW_COMPLETE:
        raise HTTPException(status_code=409, detail="Finish the aptitude round before the coding round.")

    artifacts = record.get("artifacts", {})
    key = (body.groq_api_key or settings.groq_api_key or "").strip() or None

    resume_ctx = (body.resume_text or "").strip() or _resume_context(artifacts)
    jd_text = (body.jd_text or "").strip() or artifacts.get("jd_text")
    role_is_explicit = bool((body.target_role or "").strip())
    target_role = _target_role(body.target_role, artifacts)
    skills = (artifacts.get("candidate_profile") or {}).get("top_skills") or []
    candidate_name = (
        (body.candidate_name or "").strip()
        if (body.candidate_name or "").strip().lower() not in ("", "candidate")
        else artifacts.get("candidate_name") or "Candidate"
    )

    if not resume_ctx:
        logger.warning(
            "Coding round for session %s has no resume context — questions will be "
            "role-generic. (Was a resume parsed in Setup?)",
            session["id"],
        )

    # If this session already ran the round (candidate hit "Take a New Coding
    # Round"), don't hand them the same titles again.
    prev = artifacts.get("coding_questions") or []
    avoid_titles = [q.get("title") for q in prev if isinstance(q, dict) and q.get("title")]

    try:
        result = generate_coding_questions(
            resume_text=resume_ctx,
            jd_text=jd_text,
            target_role=target_role,
            candidate_name=candidate_name,
            api_key=key,
            avoid_titles=avoid_titles,
            role_is_explicit=role_is_explicit,
            skills=skills,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Coding round generation failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    manager.set_artifact(session["id"], "coding_questions", result.get("questions", []))
    manager.set_artifact(
        session["id"],
        "coding_generation",
        {
            "target_role": target_role,
            "primary_language": result.get("primary_language"),
            "secondary_language": result.get("secondary_language"),
            "language_plan": result.get("language_plan"),
            "language_summary": result.get("language_summary"),
            "is_mixed": result.get("is_mixed"),
            "language_reason": result.get("language_reason"),
            "used_resume": bool(resume_ctx),
            "used_jd": bool(jd_text),
        },
    )
    logger.info(
        "Coding round for session %s: role=%r plan=%s (%s)",
        session["id"], target_role, result.get("language_summary"), result.get("language_reason"),
    )
    return result


@coding_router.post("/api/coding/evaluate")
async def coding_evaluate(body: CodingEvaluateIn, session=Depends(current_session)):
    if manager.stage_of(manager.get(session["id"])) < Stage.INTERVIEW_COMPLETE:
        raise HTTPException(status_code=409, detail="Finish the aptitude round before the coding round.")

    key = (body.groq_api_key or settings.groq_api_key or "").strip() or None
    try:
        result = evaluate_coding_submission(
            questions=body.questions,
            submissions=body.submissions,
            time_taken_seconds=body.time_taken_seconds,
            api_key=key,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Coding round evaluation failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    manager.set_artifact(session["id"], "coding_result", result)
    manager.advance(session["id"], Stage.CODING_COMPLETE)
    result["session_id"] = session["id"]
    result["stage"] = "CODING_COMPLETE"
    return result


def _run_python_code(code: str, stdin_data: Optional[str] = None, timeout_sec: int = 5) -> Dict[str, Any]:
    start = time.perf_counter()
    try:
        proc = subprocess.run(
            [sys.executable, "-I", "-c", code],
            input=stdin_data or "",
            capture_output=True,
            text=True,
            timeout=timeout_sec,
        )
        elapsed = time.perf_counter() - start
        return {
            "status": "success" if proc.returncode == 0 else "error",
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "exit_code": proc.returncode,
            "execution_time_ms": round(elapsed * 1000, 2),
        }
    except subprocess.TimeoutExpired as exc:
        elapsed = time.perf_counter() - start
        out = (exc.stdout or "").decode("utf-8", errors="replace") if isinstance(exc.stdout, bytes) else (exc.stdout or "")
        return {
            "status": "timeout",
            "stdout": out,
            "stderr": f"Time Limit Exceeded: Execution exceeded {timeout_sec} seconds.",
            "exit_code": -1,
            "execution_time_ms": round(elapsed * 1000, 2),
        }
    except Exception as exc:  # noqa: BLE001
        elapsed = time.perf_counter() - start
        return {
            "status": "error",
            "stdout": "",
            "stderr": str(exc),
            "exit_code": 1,
            "execution_time_ms": round(elapsed * 1000, 2),
        }


def _run_sql_code(code: str) -> Dict[str, Any]:
    start = time.perf_counter()
    try:
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()
        statements = [s.strip() for s in code.strip().split(";") if s.strip()]
        output_lines = []
        for stmt in statements:
            cursor.execute(stmt)
            if cursor.description:
                headers = [d[0] for d in cursor.description]
                rows = cursor.fetchall()
                col_widths = [len(h) for h in headers]
                for r in rows:
                    for i, val in enumerate(r):
                        col_widths[i] = max(col_widths[i], len(str(val)))

                sep = "+" + "+".join("-" * (w + 2) for w in col_widths) + "+"
                header_line = "|" + "|".join(f" {headers[i].ljust(col_widths[i])} " for i in range(len(headers))) + "|"
                output_lines.append(sep)
                output_lines.append(header_line)
                output_lines.append(sep)
                for r in rows:
                    row_line = "|" + "|".join(f" {str(r[i]).ljust(col_widths[i])} " for i in range(len(r))) + "|"
                    output_lines.append(row_line)
                output_lines.append(sep)
                output_lines.append(f"({len(rows)} row{'s' if len(rows) != 1 else ''})\n")
            else:
                conn.commit()
                first_word = stmt.split()[0].upper() if stmt.split() else "STATEMENT"
                output_lines.append(f"Query OK: {first_word} executed successfully.")

        elapsed = time.perf_counter() - start
        conn.close()
        return {
            "status": "success",
            "stdout": "\n".join(output_lines) if output_lines else "Query executed successfully (no rows returned).",
            "stderr": "",
            "exit_code": 0,
            "execution_time_ms": round(elapsed * 1000, 2),
        }
    except Exception as exc:  # noqa: BLE001
        elapsed = time.perf_counter() - start
        return {
            "status": "error",
            "stdout": "",
            "stderr": f"SQL Error: {exc}",
            "exit_code": 1,
            "execution_time_ms": round(elapsed * 1000, 2),
        }


def _run_with_llm(code: str, language: str, stdin_data: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    start = time.perf_counter()
    try:
        from modules.coding.llm import get_openai_client

        client = get_openai_client(api_key)
        prompt = f"""You are a precise code execution engine and compiler.
Simulate the compilation and execution of the following {language} code with the given standard input:

--- CODE ---
{code}

--- STDIN ---
{stdin_data or "None"}

Analyze the code for syntax or compilation errors. If there are syntax errors, simulate the compiler error message.
If it compiles, execute the code step by step and produce the exact standard output (stdout) and standard error (stderr).

Return ONLY a valid JSON object in this exact format, with no other text:
{{
    "status": "success",
    "stdout": "exact simulated standard output",
    "stderr": "",
    "exit_code": 0
}}
"""
        model_name = (
            getattr(settings, "coding_groq_model", None)
            or os.getenv("CODING_GROQ_MODEL")
            or getattr(settings, "groq_model", None)
            or "openai/gpt-oss-120b"
        )
        resp = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        content = (resp.choices[0].message.content or "").strip()
        content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
        if content.startswith("```"):
            lines = content.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            content = "\n".join(lines).strip()
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"(\{.*\})", content, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
            else:
                raise
        elapsed = time.perf_counter() - start
        return {
            "status": parsed.get("status", "success"),
            "stdout": str(parsed.get("stdout", "") or ""),
            "stderr": str(parsed.get("stderr", "") or ""),
            "exit_code": int(parsed.get("exit_code", 0)),
            "execution_time_ms": round(elapsed * 1000, 2),
            "engine": "simulated",
        }
    except Exception as exc:  # noqa: BLE001
        elapsed = time.perf_counter() - start
        return {
            "status": "error",
            "stdout": "",
            "stderr": f"Execution failed: {exc}",
            "exit_code": 1,
            "execution_time_ms": round(elapsed * 1000, 2),
        }


@coding_router.post("/api/coding/run")
async def coding_run(body: CodingRunIn, session=Depends(current_session)):
    """Interactive code execution endpoint for the coding round compiler.

    Allows the candidate to compile and test-run their solution before final
    submission. Does not advance stages or alter session progression.
    """
    code = (body.code or "").strip()
    if not code:
        return {
            "status": "error",
            "stdout": "",
            "stderr": "Error: Code is empty. Write some code before clicking Run.",
            "exit_code": 1,
            "execution_time_ms": 0,
        }

    lang = (body.language or "python").lower().strip()
    key = (body.groq_api_key or settings.groq_api_key or "").strip() or None

    if lang in ("python", "py"):
        return _run_python_code(body.code, body.stdin)
    if "sql" in lang:
        return _run_sql_code(body.code)
    return _run_with_llm(body.code, body.language, body.stdin, key)

