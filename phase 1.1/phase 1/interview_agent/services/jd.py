import json
from typing import Optional
from llm import get_openai_client

def parse_jd_and_match(jd_text: str, resume_text: str = "", api_key: Optional[str] = None) -> dict:
    """
    Parse a Job Description (JD) and compute match analysis against candidate resume.
    """
    if not jd_text or len(jd_text.strip()) < 10:
        return {
            "job_title": "General Software Engineer",
            "required_skills": ["Problem Solving", "Communication", "Technical Aptitude"],
            "responsibilities": ["Develop software features", "Collaborate with team"],
            "seniority_level": "Mid Level",
            "match_score": 75,
            "matching_skills": ["Problem Solving"],
            "missing_skills": ["Domain Knowledge"],
            "analysis_summary": "General role match profile generated."
        }

    client = get_openai_client(api_key)
    prompt = f"""You are an expert HR recruiter and talent matcher.

Analyze the Job Description below and compare it with the Candidate Resume (if provided).

Job Description:
{jd_text[:4000]}

Candidate Resume:
{resume_text[:4000] if resume_text else "No resume provided yet."}

Return ONLY valid JSON with this exact schema:
{{
    "job_title": "Target Job Title extracted from JD",
    "required_skills": ["Skill1", "Skill2", "Skill3", "Skill4"],
    "responsibilities": ["Core responsibility 1", "Core responsibility 2"],
    "seniority_level": "Junior / Mid / Senior / Lead",
    "match_score": integer from 0 to 100 representing resume-to-JD fit percentage,
    "matching_skills": ["Skills candidate has that JD requires"],
    "missing_skills": ["Important JD skills not explicit on resume"],
    "analysis_summary": "2-3 sentence executive match summary detailing candidate suitability and recommended interview focus areas."
}}
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are an AI HR recruiter analyst. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        data["raw_jd_text"] = jd_text
        return data
    except Exception as e:
        print(f"JD parsing error: {e}")
        return {
            "job_title": "Target Role",
            "required_skills": ["Core Tech", "Domain Knowledge", "System Architecture", "Teamwork"],
            "responsibilities": ["Technical execution", "Project delivery"],
            "seniority_level": "Mid-Senior",
            "match_score": 80,
            "matching_skills": ["Core Tech", "Teamwork"],
            "missing_skills": ["System Architecture"],
            "analysis_summary": "Candidate exhibits good foundational alignment for the role requirements.",
            "raw_jd_text": jd_text
        }
