"""
Module 4 — Performance & Evaluation.

Aggregates every artifact a session produced (parsed resume, JD alignment,
aptitude result, coding round review, per-answer interview feedback) into one
scored report, and exposes it as JSON and as a downloadable PDF.

    GET  /api/performance/current            summary for the cookie session
    GET  /api/performance/{session_id}       summary for a specific session
    POST /api/performance/{session_id}       persist a final report  (⇒ EVALUATED)
    GET  /api/performance/{session_id}/report.pdf     download (PDF, or HTML fallback)

The static Module 4 dashboard (``frontend/performance/``) still renders its
showcase view; these endpoints power the "fetch JSON summary / export report"
requirement and are what a caller integrates against.
"""
from __future__ import annotations

import io
import json
import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse

from llm_factory import LLMError, get_llm
from session_manager import Stage, current_session, manager

logger = logging.getLogger("jobjugad.performance")

performance_router = APIRouter(tags=["performance"])


# ── scoring & improvement factor analysis ─────────────────────────────────
def _extract_improvement_factors(artifacts: Dict[str, Any], candidate_name: str) -> Dict[str, Any]:
    assessment = artifacts.get("assessment_result") or {}
    coding = artifacts.get("coding_result") or {}
    ai_interview = artifacts.get("ai_interview_result") or {}

    # 1. Round 1: Aptitude & Reasoning Improvement Factors
    apt_factors = []
    detailed_apt = assessment.get("detailed_review") or []
    wrong_apt = [q for q in detailed_apt if not q.get("is_correct")]

    wrong_subtopics: Dict[str, int] = {}
    for q in wrong_apt:
        sub = q.get("subtopic") or q.get("category") or "General"
        wrong_subtopics[sub] = wrong_subtopics.get(sub, 0) + 1

    quant = assessment.get("aptitude") or {}
    logic = assessment.get("reasoning") or {}
    quant_pct = float(quant.get("percentage", 0) or 0)
    logic_pct = float(logic.get("percentage", 0) or 0)

    if wrong_subtopics:
        sorted_subtopics = sorted(wrong_subtopics.items(), key=lambda x: x[1], reverse=True)
        top_missed = [s[0] for s in sorted_subtopics[:3]]
        apt_factors.append({
            "title": f"Targeted Review in {', '.join(top_missed)}",
            "description": f"{candidate_name} missed questions in {', '.join(top_missed)}. Revisit core formulas, shortcut elimination, and practice 15–20 high-frequency problem variants in these domains.",
            "severity": "high" if len(wrong_apt) >= 5 else "medium",
            "category": "Topic Accuracy",
        })

    if quant_pct and logic_pct:
        if quant_pct < logic_pct and (logic_pct - quant_pct) >= 15:
            apt_factors.append({
                "title": "Quantitative Math vs. Logical Reasoning Gap",
                "description": f"Quantitative score ({quant_pct:.0f}%) is lagging behind Logical Reasoning ({logic_pct:.0f}%). Focus on commercial math (P&L, Compound Interest) and Speed/Time/Distance calculations.",
                "severity": "medium",
                "category": "Domain Balance",
            })
        elif logic_pct < quant_pct and (quant_pct - logic_pct) >= 15:
            apt_factors.append({
                "title": "Logical Deduction & Pattern Recognition Gap",
                "description": f"Logical Reasoning ({logic_pct:.0f}%) lagged behind Quantitative Math ({quant_pct:.0f}%). Strengthen deductive logic (syllogisms, seating arrangements, matrix decoding).",
                "severity": "medium",
                "category": "Domain Balance",
            })

    time_taken = assessment.get("time_taken_seconds", 0)
    total_q = assessment.get("total_questions", 20) or 20
    if time_taken and total_q:
        avg_time = time_taken / total_q
        if avg_time > 70:
            apt_factors.append({
                "title": "Pacing & Speed Optimization Under Time Constraints",
                "description": f"{candidate_name} averaged {avg_time:.0f}s per question. Target 45–50s per question so that complex word problems have sufficient time buffers.",
                "severity": "low",
                "category": "Pacing",
            })

    if not apt_factors:
        apt_factors.append({
            "title": "Sustain High-Accuracy Speed Drills",
            "description": f"{candidate_name} performed strongly in foundational reasoning. Continue solving advanced difficulty puzzles to maintain top-percentile test agility.",
            "severity": "low",
            "category": "Consistency",
        })

    # 2. Round 2: Coding Assessment Improvement Factors
    coding_factors = []
    coding_reviews = coding.get("detailed_review") or []
    unattempted = [p for p in coding_reviews if not p.get("is_attempted")]
    all_issues = []
    all_suggestions = []
    for p in coding_reviews:
        all_issues.extend(p.get("issues") or [])
        all_suggestions.extend(p.get("suggestions") or [])

    if unattempted:
        coding_factors.append({
            "title": f"Complete All Challenges Within Time Limit ({len(unattempted)} unattempted)",
            "description": f"{len(unattempted)} coding challenge(s) were not attempted by {candidate_name}. Practice timeboxing: code a baseline working solution in the first 10 minutes before optimizing.",
            "severity": "high",
            "category": "Completion",
        })

    if all_issues:
        unique_issues = list(dict.fromkeys(all_issues))[:3]
        coding_factors.append({
            "title": "Edge Case & Boundary Guard Conditions",
            "description": f"Evaluation flagged edge-case vulnerabilities: {'; '.join(unique_issues)}. Explicitly test null inputs, empty collections, and extreme bounds before final submission.",
            "severity": "high" if len(all_issues) >= 3 else "medium",
            "category": "Correctness",
        })

    diff_breakdown = coding.get("difficulty_breakdown") or {}
    hard_score = float(diff_breakdown.get("hard", 0) or 0)
    if hard_score < 60:
        coding_factors.append({
            "title": "Big-O Time & Space Complexity Optimization",
            "description": f"Performance on hard algorithmic challenges suggests room for complexity optimization. Focus on transition from brute-force O(n²) to O(n log n) or O(n) utilizing HashMaps and Two-Pointer paradigms.",
            "severity": "medium",
            "category": "Algorithm Efficiency",
        })

    if not coding_factors:
        coding_factors.append({
            "title": "Code Cleanliness & Modular Structure",
            "description": f"{candidate_name} produced clean logic. Continue adhering to defensive programming, early returns, and comprehensive inline test assertions.",
            "severity": "low",
            "category": "Code Quality",
        })

    # 3. Round 3: AI Interview Improvement Factors
    interview_factors = []
    top_weaknesses = ai_interview.get("top_weaknesses") or []
    improvement_roadmap = ai_interview.get("improvement_roadmap") or []
    radar = ai_interview.get("radar_metrics") or {}

    if top_weaknesses:
        for idx, w in enumerate(top_weaknesses[:3]):
            interview_factors.append({
                "title": f"Technical Articulation & Depth Area #{idx+1}",
                "description": f"{w}. Provide granular technical trade-offs, architecture decisions, and design justifications rather than high-level statements.",
                "severity": "high" if idx == 0 else "medium",
                "category": "Technical Articulation",
            })

    if improvement_roadmap:
        for item in improvement_roadmap[:2]:
            clean_item = item.split(". ", 1)[-1] if ". " in item else item
            parts = clean_item.split(":", 1)
            title = parts[0].strip() if len(parts) > 1 else "Framework Structuring"
            desc = parts[1].strip() if len(parts) > 1 else clean_item
            interview_factors.append({
                "title": f"{title} (STAR Method & Metrics)",
                "description": desc,
                "severity": "medium",
                "category": "Communication Structure",
            })

    for metric_name, val in radar.items():
        if float(val) < 65:
            interview_factors.append({
                "title": f"Elevate {metric_name} in Live Dialogues",
                "description": f"{candidate_name}'s {metric_name} scored {val}/100. Practice structured responses to build confidence, concise delivery, and technical precision.",
                "severity": "medium",
                "category": metric_name,
            })

    if not interview_factors:
        interview_factors.append({
            "title": "Quantitative Business Impact Articulation",
            "description": f"When explaining past engineering initiatives, {candidate_name} should consistently link solutions to quantifiable metrics (e.g., latency reduction by 25%, handling 100k DAU).",
            "severity": "low",
            "category": "Impact Storytelling",
        })

    return {
        "aptitude_factors": apt_factors,
        "coding_factors": coding_factors,
        "interview_factors": interview_factors,
    }


def _score_from_artifacts(artifacts: Dict[str, Any]) -> Dict[str, Any]:
    profile = artifacts.get("candidate_profile") or {}
    assessment = artifacts.get("assessment_result") or {}
    coding = artifacts.get("coding_result") or {}
    coding_gen = artifacts.get("coding_generation") or {}
    ai_interview = artifacts.get("ai_interview_result") or {}

    candidate_name = (
        artifacts.get("candidate_name")
        or (ai_interview.get("candidate_name") if isinstance(ai_interview, dict) else None)
        or profile.get("candidate_name")
        or (artifacts.get("ai_interview_meta") or {}).get("candidate_name")
        or (coding_gen.get("candidate_name") if isinstance(coding_gen, dict) else None)
        or "Candidate"
    )
    job_title = (
        artifacts.get("job_title")
        or (ai_interview.get("job_title") if isinstance(ai_interview, dict) else None)
        or profile.get("primary_role")
        or (artifacts.get("ai_interview_meta") or {}).get("job_title")
        or coding_gen.get("target_role")
        or "Software Development Engineer"
    )

    aptitude_pct = float(assessment.get("score_percentage", 0) or 0)
    coding_pct = float(coding.get("score_percentage", 0) or 0)
    ai_interview_pct = float(ai_interview.get("overall_score", 0) or 0)

    # Strictly 3 rounds
    components = [
        {
            "round_number": 1,
            "id": "aptitude",
            "name": "Round 1: Aptitude & Reasoning",
            "score": round(aptitude_pct, 1),
            "weight": 0.30,
            "status": "Completed" if assessment else "Pending",
        },
        {
            "round_number": 2,
            "id": "coding",
            "name": (
                f"Round 2: Coding Assessment ({coding_gen.get('primary_language')})"
                if coding_gen.get("primary_language")
                else "Round 2: Coding Assessment"
            ),
            "score": round(coding_pct, 1),
            "weight": 0.35,
            "status": "Completed" if coding else "Pending",
        },
        {
            "round_number": 3,
            "id": "ai_interview",
            "name": "Round 3: AI Interview",
            "score": round(ai_interview_pct, 1),
            "weight": 0.35,
            "status": "Completed" if ai_interview else "Pending",
        },
    ]

    completed = [c for c in components if c["status"] == "Completed"]
    if completed:
        wsum = sum(c["weight"] for c in completed)
        overall = round(sum(c["score"] * c["weight"] for c in completed) / wsum, 1)
    else:
        overall = 0.0

    if overall >= 80:
        recommendation = "Strong Hire"
    elif overall >= 65:
        recommendation = "Hire"
    elif overall >= 50:
        recommendation = "Conditional Hire / Re-evaluate"
    else:
        recommendation = "Needs Improvement"

    improvement_factors = _extract_improvement_factors(artifacts, candidate_name)

    return {
        "candidate_name": candidate_name,
        "job_title": job_title,
        "overall_score": overall,
        "recommendation": recommendation,
        "components": components,
        "improvement_factors": improvement_factors,
        "aptitude_breakdown": {
            "score_percentage": aptitude_pct,
            "total_questions": assessment.get("total_questions", 0),
            "correct_answers": assessment.get("correct_answers", 0),
            "time_taken_seconds": assessment.get("time_taken_seconds", 0),
            "verdict": assessment.get("verdict", "Good Competency"),
            "summary": assessment.get("summary", ""),
            "aptitude": assessment.get("aptitude", {}),
            "reasoning": assessment.get("reasoning", {}),
            "detailed_review": assessment.get("detailed_review", []),
            "improvement_factors": improvement_factors.get("aptitude_factors", []),
        },
        "coding_breakdown": {
            "score_percentage": coding_pct,
            "total_questions": coding.get("total_questions", 0),
            "time_taken_seconds": coding.get("time_taken_seconds", 0),
            "verdict": coding.get("verdict", "Evaluated"),
            "summary": coding.get("summary", ""),
            "primary_language": coding_gen.get("primary_language", "Python"),
            "language_summary": coding_gen.get("language_summary", ""),
            "difficulty_breakdown": coding.get("difficulty_breakdown", {}),
            "detailed_review": coding.get("detailed_review", []),
            "improvement_factors": improvement_factors.get("coding_factors", []),
        },
        "ai_interview_breakdown": {
            "score_percentage": ai_interview_pct,
            "verdict": ai_interview.get("recommendation", "Evaluated"),
            "summary": ai_interview.get("summary", ""),
            "hiring_note": ai_interview.get("hiring_note", ""),
            "radar_metrics": ai_interview.get("radar_metrics", {}),
            "top_strengths": ai_interview.get("top_strengths", []),
            "top_weaknesses": ai_interview.get("top_weaknesses", []),
            "improvement_roadmap": ai_interview.get("improvement_roadmap", []),
            "individual_evaluations": ai_interview.get("individual_evaluations", []),
            "improvement_factors": improvement_factors.get("interview_factors", []),
        },
    }


def _build_summary(record: Dict[str, Any]) -> Dict[str, Any]:
    artifacts = record.get("artifacts", {})
    summary = _score_from_artifacts(artifacts)
    summary["session_id"] = record["id"]
    summary["stage"] = Stage(record["stage"]).label
    summary["generated_from"] = sorted(artifacts.keys())
    return summary


# ── endpoints ──────────────────────────────────────────────────────────────
@performance_router.get("/api/performance/current")
async def performance_current(session=Depends(current_session)):
    record = manager.get(session["id"])
    return _build_summary(record)


@performance_router.get("/api/performance/{session_id}")
async def performance_summary(session_id: str):
    record = manager.get(session_id)
    if not record:
        raise HTTPException(status_code=404, detail="Unknown session.")
    return _build_summary(record)


@performance_router.post("/api/performance/{session_id}")
async def persist_report(session_id: str, report: Dict[str, Any]):
    record = manager.get(session_id)
    if not record:
        raise HTTPException(status_code=404, detail="Unknown session.")
    merged = {**_build_summary(record), **report}
    manager.set_artifact(session_id, "final_report", merged)
    (manager.dir(session_id) / "report.json").write_text(json.dumps(merged, indent=2), "utf-8")
    manager.advance(session_id, Stage.EVALUATED)
    return {"status": "success", "session_id": session_id, "stage": "EVALUATED", "report": merged}


@performance_router.get("/api/performance/{session_id}/narrative")
async def performance_narrative(session_id: str, provider: str | None = None):
    """LLM-written executive debrief (falls back to deterministic 3-round summary)."""
    record = manager.get(session_id)
    if not record:
        raise HTTPException(status_code=404, detail="Unknown session.")
    summary = _build_summary(record)
    try:
        text = get_llm(provider).complete(
            f"Write a concise 150-word executive debrief for candidate {summary['candidate_name']} applying for {summary['job_title']}. "
            f"Focus on their 3 rounds (Aptitude: {summary['aptitude_breakdown']['score_percentage']}%, Coding: {summary['coding_breakdown']['score_percentage']}%, AI Interview: {summary['ai_interview_breakdown']['score_percentage']}%) "
            f"and highlight key improvement areas. Data: {json.dumps(summary)}",
            "You are an engineering hiring committee lead. Plain prose, no markdown.",
            temperature=0.4,
            max_tokens=400,
        )
    except LLMError as exc:
        text = summary["ai_interview_breakdown"].get("summary") or summary["aptitude_breakdown"].get("summary") or (
            f"{summary['candidate_name']} achieved an overall score of {summary['overall_score']}% "
            f"({summary['recommendation']}) across Aptitude & Reasoning, Coding Assessment, and AI Interview."
        )
    return {"session_id": session_id, "narrative": text, "summary": summary}


@performance_router.get("/api/performance/{session_id}/report.pdf")
async def report_pdf(session_id: str):
    record = manager.get(session_id)
    if not record:
        raise HTTPException(status_code=404, detail="Unknown session.")
    summary = _build_summary(record)

    try:
        pdf_bytes = _render_pdf(summary)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="jobjugad_{summary["candidate_name"].replace(" ", "_")}_report.pdf"'},
        )
    except ImportError:
        html = _render_html(summary)
        return HTMLResponse(
            html,
            headers={"Content-Disposition": f'attachment; filename="jobjugad_{summary["candidate_name"].replace(" ", "_")}_report.html"'},
        )


def _render_pdf(summary: Dict[str, Any]) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    y = height - 25 * mm

    def line(text: str, size: int = 11, dy: float = 6 * mm, bold: bool = False):
        nonlocal y
        c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
        c.drawString(20 * mm, y, str(text)[:105])
        y -= dy

    line("JobJugad — 3-Round Candidate Performance Report", 16, 10 * mm, bold=True)
    line(f"Candidate Name: {summary['candidate_name']}", 12, bold=True)
    line(f"Target Role: {summary['job_title']}   |   Status: {summary['recommendation']}")
    line(f"Overall Composite Score: {summary['overall_score']}%", 12, bold=True)
    y -= 3 * mm

    line("Evaluation Across 3 Rounds:", 12, bold=True)
    for comp in summary["components"]:
        status_txt = f"[{comp['status']}]"
        line(f"  • {comp['name']}: {comp['score']}%  (Weight: {int(comp['weight']*100)}%) {status_txt}")

    y -= 3 * mm
    line(f"Key Improvement Factors for {summary['candidate_name']}:", 12, bold=True)

    factors = summary.get("improvement_factors", {})
    line("1. Aptitude & Reasoning Improvement Factors:", 10, bold=True)
    for item in factors.get("aptitude_factors", [])[:2]:
        line(f"   - {item['title']}: {item['description'][:95]}")

    line("2. Coding Assessment Improvement Factors:", 10, bold=True)
    for item in factors.get("coding_factors", [])[:2]:
        line(f"   - {item['title']}: {item['description'][:95]}")

    line("3. AI Interview Improvement Factors:", 10, bold=True)
    for item in factors.get("interview_factors", [])[:2]:
        line(f"   - {item['title']}: {item['description'][:95]}")

    c.showPage()
    c.save()
    return buf.getvalue()


def _render_html(summary: Dict[str, Any]) -> str:
    factors = summary.get("improvement_factors", {})
    name = summary["candidate_name"]

    comp_rows = "".join(
        f"<tr><td style='padding:8px;font-weight:600;'>{c['name']}</td>"
        f"<td style='padding:8px;text-align:center;'>{c['score']}%</td>"
        f"<td style='padding:8px;text-align:center;'>{int(c['weight']*100)}%</td>"
        f"<td style='padding:8px;text-align:center;'>{c['status']}</td></tr>"
        for c in summary["components"]
    )

    def render_factor_items(items):
        if not items:
            return "<li>Continue focused practice.</li>"
        return "".join(
            f"<li style='margin-bottom:8px;'><strong>{f['title']}:</strong> {f['description']}</li>"
            for f in items
        )

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>JobJugad Performance Report — {name}</title>
<style>
  body {{ font-family: system-ui, -apple-system, sans-serif; max-width: 860px; margin: 30px auto; padding: 24px; color: #0f172a; line-height: 1.6; }}
  h1 {{ font-size: 1.8rem; margin-bottom: 4px; color: #1e293b; }}
  .header-meta {{ color: #64748b; font-size: 0.95rem; margin-bottom: 24px; }}
  .score-badge {{ display: inline-block; background: #6366f1; color: white; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 1.1rem; margin-bottom: 20px; }}
  table {{ width: 100%; border-collapse: collapse; margin-bottom: 28px; }}
  th {{ background: #f1f5f9; padding: 10px; text-align: left; font-size: 0.88rem; }}
  tr:nth-child(even) {{ background: #f8fafc; }}
  .factor-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 16px; }}
  .factor-box h3 {{ margin-top: 0; font-size: 1.1rem; color: #334155; }}
  ul {{ padding-left: 20px; margin: 0; }}
  @media print {{ button {{ display: none; }} }}
</style>
</head>
<body>
<h1>Candidate Performance Report</h1>
<p class="header-meta"><strong>Candidate:</strong> {name} &nbsp;|&nbsp; <strong>Target Role:</strong> {summary['job_title']} &nbsp;|&nbsp; <strong>Verdict:</strong> {summary['recommendation']}</p>
<div class="score-badge">Overall Score: {summary['overall_score']}% ({summary['recommendation']})</div>

<h2>3-Round Assessment Summary</h2>
<table border="1" bordercolor="#e2e8f0">
  <tr><th>Assessment Round</th><th style="text-align:center;">Score</th><th style="text-align:center;">Weight</th><th style="text-align:center;">Status</th></tr>
  {comp_rows}
</table>

<h2>Key Areas for {name} to Improve</h2>
<div class="factor-box">
  <h3>Round 1: Aptitude & Reasoning Improvement Factors</h3>
  <ul>{render_factor_items(factors.get("aptitude_factors", []))}</ul>
</div>
<div class="factor-box">
  <h3>Round 2: Coding & Algorithmic Rigor Improvement Factors</h3>
  <ul>{render_factor_items(factors.get("coding_factors", []))}</ul>
</div>
<div class="factor-box">
  <h3>Round 3: AI Interview & Articulation Improvement Factors</h3>
  <ul>{render_factor_items(factors.get("interview_factors", []))}</ul>
</div>

<br>
<button onclick="window.print()" style="padding:10px 20px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Print / Save as PDF</button>
</body>
</html>"""

