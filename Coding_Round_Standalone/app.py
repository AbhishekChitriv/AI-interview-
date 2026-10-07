"""
Standalone Coding Round
=======================
A self-contained extract of the "Coding Round" feature from the
AI_Interview_Live platform. Serves a single-page coding panel and two
API endpoints:

    POST /api/coding/generate   -> generate a 5-question coding round
    POST /api/coding/evaluate   -> AI code-review + score the submission

Run:
    pip install -r requirements.txt
    python app.py
Then open http://127.0.0.1:8000
"""
import os
import sys
import logging
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

_ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if _ROOT_DIR not in sys.path:
    sys.path.insert(0, _ROOT_DIR)

from coding_round import generate_coding_questions, evaluate_coding_submission

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CodingRound")

app = FastAPI(title="Coding Round - Standalone")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CodingGenerateRequest(BaseModel):
    resume_text: Optional[str] = None
    jd_text: Optional[str] = None
    target_role: Optional[str] = None
    candidate_name: str = "Candidate"
    groq_api_key: Optional[str] = None


class CodingEvaluateRequest(BaseModel):
    questions: List[Dict]
    submissions: Dict[str, Any] = Field(default_factory=dict)
    time_taken_seconds: int = 0
    groq_api_key: Optional[str] = None


class CodingRunRequest(BaseModel):
    code: str
    language: str = "python"
    stdin: Optional[str] = None
    question_id: Optional[str] = None
    groq_api_key: Optional[str] = None


@app.post("/api/coding/generate")
async def coding_generate(req: CodingGenerateRequest):
    """Generate a 5-question hands-on coding round (2 Easy, 2 Moderate, 1 Hard)."""
    effective_key = (req.groq_api_key or os.environ.get("GROQ_API_KEY") or "").strip()
    try:
        return generate_coding_questions(
            resume_text=req.resume_text or "",
            jd_text=req.jd_text,
            target_role=req.target_role,
            candidate_name=req.candidate_name,
            api_key=effective_key or None,
        )
    except Exception as e:
        logger.error(f"Coding round generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/coding/evaluate")
async def coding_evaluate(req: CodingEvaluateRequest):
    """Review the candidate's submitted code (no execution) and return per-question feedback + score."""
    effective_key = (req.groq_api_key or os.environ.get("GROQ_API_KEY") or "").strip()
    try:
        return evaluate_coding_submission(
            questions=req.questions,
            submissions=req.submissions,
            time_taken_seconds=req.time_taken_seconds,
            api_key=effective_key or None,
        )
    except Exception as e:
        logger.error(f"Coding round evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _run_python_code(code: str, stdin_data: Optional[str] = None, timeout_sec: int = 5) -> Dict[str, Any]:
    import subprocess
    import time
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
    except Exception as exc:
        elapsed = time.perf_counter() - start
        return {
            "status": "error",
            "stdout": "",
            "stderr": str(exc),
            "exit_code": 1,
            "execution_time_ms": round(elapsed * 1000, 2),
        }


def _run_sql_code(code: str) -> Dict[str, Any]:
    import sqlite3
    import time
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
    except Exception as exc:
        elapsed = time.perf_counter() - start
        return {
            "status": "error",
            "stdout": "",
            "stderr": f"SQL Error: {exc}",
            "exit_code": 1,
            "execution_time_ms": round(elapsed * 1000, 2),
        }


def _run_with_llm(code: str, language: str, stdin_data: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    import json
    import time
    start = time.perf_counter()
    try:
        from llm import get_openai_client

        client = get_openai_client(api_key)
        prompt = f"""You are a precise code execution engine and compiler.
Simulate the compilation and execution of the following {language} code with the given standard input:

--- CODE ---
{code}

--- STDIN ---
{stdin_data or "None"}

Analyze the code for syntax or compilation errors. If there are syntax errors, simulate the compiler error message.
If it compiles, execute the code step by step and produce the exact standard output (stdout) and standard error (stderr).

Return ONLY a valid JSON object in this exact format, with no markdown code fences:
{{
    "status": "success" or "error",
    "stdout": "exact simulated standard output",
    "stderr": "simulated compiler/runtime errors if any, otherwise empty string",
    "exit_code": 0 or 1
}}
"""
        resp = client.chat.completions.create(
            model=os.environ.get("CODING_GROQ_MODEL", "openai/gpt-oss-20b"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )
        content = (resp.choices[0].message.content or "").strip()
        if content.startswith("```"):
            lines = content.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            content = "\n".join(lines).strip()
        parsed = json.loads(content)
        elapsed = time.perf_counter() - start
        return {
            "status": parsed.get("status", "success"),
            "stdout": parsed.get("stdout", ""),
            "stderr": parsed.get("stderr", ""),
            "exit_code": parsed.get("exit_code", 0),
            "execution_time_ms": round(elapsed * 1000, 2),
            "engine": "simulated",
        }
    except Exception as exc:
        elapsed = time.perf_counter() - start
        return {
            "status": "error",
            "stdout": "",
            "stderr": f"Execution failed: {exc}",
            "exit_code": 1,
            "execution_time_ms": round(elapsed * 1000, 2),
        }


@app.post("/api/coding/run")
async def coding_run(req: CodingRunRequest):
    code = (req.code or "").strip()
    if not code:
        return {
            "status": "error",
            "stdout": "",
            "stderr": "Error: Code is empty. Write some code before clicking Run.",
            "exit_code": 1,
            "execution_time_ms": 0,
        }

    lang = (req.language or "python").lower().strip()
    effective_key = (req.groq_api_key or os.environ.get("GROQ_API_KEY") or "").strip() or None

    if lang in ("python", "py"):
        return _run_python_code(req.code, req.stdin)
    if "sql" in lang:
        return _run_sql_code(req.code)
    return _run_with_llm(req.code, req.language, req.stdin, effective_key)


static_dir = os.path.join(_ROOT_DIR, "static")


@app.get("/")
async def read_index():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read(), headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            })
    return {"message": "Coding Round server is running."}


app.mount("/static", StaticFiles(directory=static_dir), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8010, reload=True)
