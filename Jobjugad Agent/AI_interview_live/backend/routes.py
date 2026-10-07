"""
FastAPI routes for the Aptitude & Reasoning round.

Mount into your app with:

    from aptitude_round.backend.routes import router as aptitude_router
    app.include_router(aptitude_router)

Endpoints:
    POST /api/assessment/generate   -> 20 MCQs (10 aptitude + 10 reasoning)
    POST /api/assessment/evaluate   -> score + category / difficulty breakdown + review
"""
import os
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

try:
    from .aptitude_reasoning import (
        generate_aptitude_reasoning_questions,
        evaluate_aptitude_reasoning,
    )
except ImportError:
    from aptitude_reasoning import (
        generate_aptitude_reasoning_questions,
        evaluate_aptitude_reasoning,
    )

logger = logging.getLogger("aptitude_round")

router = APIRouter(tags=["aptitude"])


class AssessmentGenerateRequest(BaseModel):
    target_role: Optional[str] = None
    candidate_name: str = "Candidate"
    groq_api_key: Optional[str] = None


class AssessmentEvaluateRequest(BaseModel):
    answers: Dict[str, Any] = Field(default_factory=dict)  # question id (str) -> selected option index
    questions: List[Dict]
    time_taken_seconds: int = 0


@router.post("/api/assessment/generate")
async def assessment_generate(req: AssessmentGenerateRequest):
    """
    Generate a 20-question Aptitude & Reasoning MCQ assessment
    (10 quantitative aptitude + 10 logical reasoning, 3/4/3 Easy/Moderate/Hard each).
    Falls back to a curated question bank if the LLM call fails or no key is set.
    """
    effective_key = (req.groq_api_key or os.environ.get("GROQ_API_KEY") or "").strip()
    try:
        return generate_aptitude_reasoning_questions(
            api_key=effective_key or None,
            target_role=req.target_role,
            candidate_name=req.candidate_name,
        )
    except Exception as e:
        logger.error(f"Assessment generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/assessment/evaluate")
async def assessment_evaluate(req: AssessmentEvaluateRequest):
    """
    Score a submitted Aptitude & Reasoning assessment and return category,
    difficulty breakdown, verdict, and a question-by-question review.
    """
    try:
        return evaluate_aptitude_reasoning(
            user_answers=req.answers,
            questions=req.questions,
            time_taken_seconds=req.time_taken_seconds,
        )
    except Exception as e:
        logger.error(f"Assessment evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
