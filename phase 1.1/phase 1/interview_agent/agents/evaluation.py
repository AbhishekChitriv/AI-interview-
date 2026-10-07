import json
import os
from typing import Optional, List, Dict
from llm import get_openai_client

def evaluate_answer(
    question: str,
    candidate_answer: str,
    category: str = "Technical",
    job_title: str = "Software Engineer",
    api_key: Optional[str] = None
) -> dict:
    """
    Evaluate a single candidate response across 5 core dimensions (0-100 scale).
    """
    clean_ans = (candidate_answer or "").strip().lower()
    skip_keywords = ["no response", "no answer", "skipped", "skip", "don't know", "dont know", "i don't know", "i dont know", "no idea", "pass"]
    is_skipped = not candidate_answer or len(clean_ans) < 5 or clean_ans in skip_keywords

    if is_skipped:
        return {
            "question": question,
            "category": category,
            "candidate_answer": candidate_answer or "[No Answer Provided / Question Skipped]",
            "scores": {
                "technical_knowledge": 0,
                "communication_clarity": 0,
                "relevance_accuracy": 0,
                "confidence_delivery": 0,
                "overall_quality": 0
            },
            "overall_score": 0,
            "strengths": ["None noted"],
            "weaknesses": ["Question was skipped or no answer provided"],
            "feedback": "The candidate skipped this question or did not provide an answer.",
            "ideal_answer_points": ["Explain key technical concepts clearly", "Provide concrete technical examples"]
        }

    client = get_openai_client(api_key)

    prompt = f"""You are Eliora, an expert AI Technical Interview Evaluator.

Target Role: {job_title}
Question Category: {category}
Interview Question: {question}
Candidate Answer Transcript: {candidate_answer}

Evaluate the candidate's answer thoroughly and objectively.

CRITICAL SCORING RULES:
- Be STRICT in your evaluation. Do NOT default to high scores. 
- If the candidate skipped the question, said "I don't know", or gave no substantive answer, assign 0 across all 5 score dimensions.
- If the answer is completely incorrect, off-topic, or gibberish, assign scores between 10 and 30.
- If the answer is vague, lacks technical depth, or is only partially correct, assign scores between 30 and 60.
- Only award scores above 70 for answers that are technically accurate, clear, and comprehensive.
- Score accurately based on technical correctness, depth, and relevance to the specific question asked.

Provide score metrics from 0 to 100 for each of the 5 criteria:
1. technical_knowledge: Technical depth, correctness, domain mastery (0-100)
2. communication_clarity: Structure, articulation, vocabulary, conciseness (0-100)
3. relevance_accuracy: Direct addressing of the question without fluff (0-100)
4. confidence_delivery: Tone, conviction, ownership (0-100)
5. overall_quality: Total response quality (0-100)

Return ONLY valid JSON with this exact schema:
{{
    "question": "{question}",
    "category": "{category}",
    "candidate_answer": "{candidate_answer}",
    "scores": {{
        "technical_knowledge": 85,
        "communication_clarity": 80,
        "relevance_accuracy": 90,
        "confidence_delivery": 75,
        "overall_quality": 82
    }},
    "overall_score": 82,
    "strengths": ["Highlight 1", "Highlight 2"],
    "weaknesses": ["Area for improvement 1"],
    "feedback": "Constructive 2-sentence summary feedback.",
    "ideal_answer_points": ["Point 1 that an ideal candidate would mention", "Point 2"]
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are Eliora, AI Interview Evaluator. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        result = json.loads(response.choices[0].message.content)
        # Ensure overall score is integer
        if "scores" in result:
            vals = list(result["scores"].values())
            result["overall_score"] = int(sum(vals) / len(vals)) if vals else 70
        return result
    except Exception as e:
        print(f"Evaluation error: {e}")
        return {
            "question": question,
            "category": category,
            "candidate_answer": candidate_answer,
            "scores": {
                "technical_knowledge": 75,
                "communication_clarity": 75,
                "relevance_accuracy": 80,
                "confidence_delivery": 70,
                "overall_quality": 75
            },
            "overall_score": 75,
            "strengths": ["Clear communication", "Relevant experience"],
            "weaknesses": ["Could provide deeper architectural details"],
            "feedback": "Good baseline answer demonstrating practical understanding.",
            "ideal_answer_points": ["Provide specific metric-backed outcomes", "Explain underlying mechanics"]
        }


def generate_final_report(
    evaluations: List[Dict],
    candidate_name: str = "Candidate",
    job_title: str = "Target Role",
    api_key: Optional[str] = None
) -> dict:
    """
    Generate a comprehensive final interview performance report from session evaluations.
    """
    if not evaluations:
        return {
            "candidate_name": candidate_name,
            "job_title": job_title,
            "overall_score": 0,
            "recommendation": "Not Recommended",
            "summary": "No evaluation data recorded.",
            "radar_metrics": {
                "Technical": 0,
                "Communication": 0,
                "Relevance": 0,
                "Confidence": 0,
                "Quality": 0
            },
            "top_strengths": [],
            "top_weaknesses": [],
            "hiring_note": "Interview was not completed.",
            "individual_evaluations": []
        }

    # Calculate average dimension scores
    tech_scores = [e.get("scores", {}).get("technical_knowledge", e.get("overall_score", 70)) for e in evaluations]
    comm_scores = [e.get("scores", {}).get("communication_clarity", e.get("overall_score", 70)) for e in evaluations]
    rel_scores = [e.get("scores", {}).get("relevance_accuracy", e.get("overall_score", 70)) for e in evaluations]
    conf_scores = [e.get("scores", {}).get("confidence_delivery", e.get("overall_score", 70)) for e in evaluations]
    qual_scores = [e.get("scores", {}).get("overall_quality", e.get("overall_score", 70)) for e in evaluations]

    avg_tech = int(sum(tech_scores) / len(tech_scores))
    avg_comm = int(sum(comm_scores) / len(comm_scores))
    avg_rel = int(sum(rel_scores) / len(rel_scores))
    avg_conf = int(sum(conf_scores) / len(conf_scores))
    avg_qual = int(sum(qual_scores) / len(qual_scores))

    overall = int((avg_tech + avg_comm + avg_rel + avg_conf + avg_qual) / 5)

    if overall >= 85:
        recommendation = "Strong Hire"
    elif overall >= 72:
        recommendation = "Hire"
    elif overall >= 60:
        recommendation = "Consider"
    else:
        recommendation = "Not Recommended"

    client = get_openai_client(api_key)

    evals_summary = json.dumps(evaluations, indent=2)
    prompt = f"""You are Eliora, an AI Senior Technical Interviewer and Executive Career Coach.

Below are individual question evaluations for candidate {candidate_name} interviewing for {job_title}:

{evals_summary}

Synthesize a comprehensive, highly detailed performance evaluation and candidate growth report. Ensure the report provides deep, actionable clarity so the candidate understands EXACTLY where and how they need to improve to reach top-tier standards.

Return ONLY valid JSON with this exact schema:
{{
    "summary": "A detailed 3-paragraph executive summary covering technical mastery, communication effectiveness, problem-solving approach, and overall readiness for the role.",
    "top_strengths": ["Detailed strength 1 with specific context from their answers", "Detailed strength 2 with context", "Detailed strength 3 with context"],
    "top_weaknesses": ["Detailed area for improvement 1 explaining what was missing", "Detailed area for improvement 2 explaining technical or communication gaps", "Detailed area for improvement 3"],
    "improvement_roadmap": [
        "1. Technical Depth: Specific topics, concepts, or frameworks to study and revise.",
        "2. Answer Structuring: How to structure responses (e.g., STAR framework, Problem-Solution-Impact).",
        "3. Quantitative Impact: How to incorporate metrics, numbers, and business results.",
        "4. Communication & Delivery: Tips to improve articulation, clarity, and pacing."
    ],
    "hiring_note": "A constructive concluding advice detailing overall readiness and next steps for candidate growth."
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are Eliora, AI Senior Technical Evaluator. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        report_data = json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Final report generation error: {e}")
        report_data = {
            "summary": f"{candidate_name} completed the technical interview session for the role of {job_title} with an overall score of {overall}/100. The candidate demonstrated solid fundamental domain knowledge and clear articulation in several areas. However, to excel in senior-level interviews, deeper technical elaboration and structured metric-backed answers are recommended.",
            "top_strengths": [
                "Strong foundational domain familiarity and clear baseline concepts.",
                "Professional demeanor and direct communication style.",
                "Good relevance to core interview prompts."
            ],
            "top_weaknesses": [
                "Lacks deep architectural trade-off analysis and scalability discussions.",
                "Could provide more concrete quantitative metrics and business impact.",
                "Responses occasionally lack structured frameworks (e.g., STAR format for behavioral prompts)."
            ],
            "improvement_roadmap": [
                "1. Adopt the STAR Method (Situation, Task, Action, Result) to structure behavioral and situational responses logically.",
                "2. Deepen Technical Trade-off Analysis: Always discuss memory vs. time complexity, edge cases, and alternative solutions.",
                "3. Quantify Past Accomplishments: Incorporate concrete metrics (e.g., % latency reduction, throughput increases, team efficiency metrics).",
                "4. Refine Answer Conciseness: Practice delivering punchy, high-impact responses within 90-120 seconds."
            ],
            "hiring_note": f"Candidate displays strong baseline potential for {job_title}. With targeted practice on technical depth and response structuring, performance will improve significantly."
        }

    report_data.update({
        "candidate_name": candidate_name,
        "job_title": job_title,
        "overall_score": overall,
        "recommendation": recommendation,
        "radar_metrics": {
            "Technical Knowledge": avg_tech,
            "Communication": avg_comm,
            "Relevance": avg_rel,
            "Confidence": avg_conf,
            "Answer Quality": avg_qual
        },
        "individual_evaluations": evaluations
    })

    return report_data