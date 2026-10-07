import os
import json
import pypdf
from typing import Optional
from llm import get_openai_client

def extract_text_from_pdf(file_path: str) -> str:
    """Extract raw text from a PDF file using pypdf."""
    try:
        reader = pypdf.PdfReader(file_path)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def extract_text_from_file(file_path: str, filename: str) -> str:
    """Extract text based on file extension (.pdf, .txt, .md, .docx)."""
    ext = os.path.splitext(filename.lower())[1]
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    else:
        # Fallback to UTF-8 text reading
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read().strip()
        except Exception as e:
            print(f"Error reading text file: {e}")
            return ""

def parse_resume_details(resume_text: str, api_key: Optional[str] = None) -> dict:
    """
    Use LLM to extract structured details from candidate resume.
    """
    if not resume_text or len(resume_text.strip()) < 10:
        return {
            "name": "Candidate",
            "skills": ["General"],
            "experience_years": "Not specified",
            "summary": "Candidate provided general profile.",
            "projects": [],
            "education": []
        }

    client = get_openai_client(api_key)
    prompt = f"""Extract structured information from the following candidate resume.

Resume Content:
{resume_text[:4000]}

Return ONLY valid JSON with this exact schema:
{{
    "name": "Candidate Name or 'Candidate'",
    "title": "Professional Title / Current Role",
    "skills": ["Skill1", "Skill2", "Skill3"],
    "experience_years": "Estimated years or level e.g. 3+ years",
    "summary": "Brief 2-sentence executive summary of candidate",
    "projects": ["Project 1 name/description", "Project 2 name/description"],
    "education": ["Degree/University"],
    "recommended_job_titles": ["Data Analyst", "Data Scientist", "Machine Learning Engineer", "AI Engineer", "Business Analyst"]
}}
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a senior recruiter resume parser. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        data["raw_text"] = resume_text
        return data
    except Exception as e:
        print(f"Resume parsing error: {e}")
        return {
            "name": "Candidate",
            "title": "Software Candidate",
            "skills": ["Python", "Problem Solving", "Communication"],
            "experience_years": "Mid-level",
            "summary": "Candidate resume processed.",
            "projects": ["Full Stack Application"],
            "education": ["Computer Science / Related Degree"],
            "recommended_job_titles": ["Data Analyst", "Data Scientist", "Machine Learning Engineer", "AI Engineer", "Business Analyst"],
            "raw_text": resume_text
        }
