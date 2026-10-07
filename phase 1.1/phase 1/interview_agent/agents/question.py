import os
import json
from typing import Optional
from llm import get_openai_client

def generate_interview_questions(
    resume: str,
    job_description: Optional[str] = None,
    num_questions: int = 10,
    api_key: Optional[str] = None
) -> dict:
    """
    Generate tailored, realistic interview questions from candidate resume and optional job description.
    Total: 10 questions.
    Questions 1-3 are common to every domain:
      1) Introduce yourself, education background, skills
      2) Why you apply for this role?
      3) What are your expectations?
    The other 7 questions are tailored specifically to the candidate's resume domain and Job Description.
    """
    hardcoded_questions = [
        {
            "id": 1,
            "question": "Introduce yourself, education background, skills",
            "category": "Introduction",
            "intent": "Candidate introduction, educational background, key skills & professional experience",
            "key_points_to_look_for": [
                "Educational background",
                "Key technical skills",
                "Relevant experience",
                "Communication clarity and structure"
            ]
        },
        {
            "id": 2,
            "question": "Why you apply for this role?",
            "category": "Motivation",
            "intent": "Role fit, domain interest, and motivation for applying",
            "key_points_to_look_for": [
                "Interest in role",
                "Company/domain alignment",
                "Career motivation"
            ]
        },
        {
            "id": 3,
            "question": "What are your expectations?",
            "category": "Expectations",
            "intent": "Candidate expectations from the role, team, and organization",
            "key_points_to_look_for": [
                "Professional growth goals",
                "Work environment & culture fit",
                "Role clarity"
            ]
        }
    ]

    client = get_openai_client(api_key)
    jd_context = f"\n\nTarget Job Description:\n{job_description}" if job_description else ""

    remaining_count = max(0, num_questions - 3)

    prompt = f"""You are Eliora, an elite AI HR Recruiter and Lead Technical Interviewer.

The interview consists of {num_questions} total questions.
The first 3 questions are already established and common to every domain:
1) Introduce yourself, education background, skills
2) Why you apply for this role?
3) What are your expectations?

Your task is to generate exactly {remaining_count} realistic, highly tailored interview questions for this candidate based on their Resume domain and the Target Job Description. Note: Questions 1 to 3 are already covered, so do NOT repeat or rephrase them. Generate deep domain-specific technical, project, scenario, and behavioral questions.

Candidate Resume:
{resume[:4000]}
{jd_context[:4000]}

Ensure the {remaining_count} questions strictly align with the candidate's domain and target Job Description, covering a balanced mix of:
- Technical Skills & Core Domain Architecture (assessing hands-on technical depth)
- Specific Projects & Experience from Resume (challenges solved, tech stacks, architectural choices)
- Real-World Problem Solving, Debugging & Scenario Handling
- STAR Behavioral, Collaboration & Role Alignment

Return ONLY valid JSON with this exact schema:
{{
    "questions": [
        {{
            "id": 4,
            "question": "Clear, professional interview question text",
            "category": "Technical | Project | Behavioral | Scenario",
            "intent": "What this question assesses in candidate domain & job description",
            "key_points_to_look_for": ["point 1", "point 2"]
        }}
    ]
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are Eliora, an AI HR Recruiter. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            response_format={"type": "json_object"}
        )
        raw = response.choices[0].message.content
        result = json.loads(raw)
        generated = result.get("questions", [])
    except Exception as e:
        print(f"Error generating interview questions: {e}")
        generated = [
            {
                "question": "Walk me through the most technically challenging project listed on your resume. What architectural decisions did you make and why?",
                "category": "Project",
                "intent": "Technical ownership and problem solving in project domain",
                "key_points_to_look_for": ["System architecture", "Tradeoff analysis", "Technical depth"]
            },
            {
                "question": "Looking at the core domain requirements for this role, how does your hands-on experience align with the technical stack we use?",
                "category": "Technical",
                "intent": "Domain alignment and technical competence with required tools",
                "key_points_to_look_for": ["Core competencies", "Domain expertise", "Practical experience"]
            },
            {
                "question": "Can you describe a complex bug, performance bottleneck, or edge case you encountered in your domain and how you systematically resolved it?",
                "category": "Technical",
                "intent": "Debugging methodology and analytical problem-solving",
                "key_points_to_look_for": ["Root-cause analysis", "Debugging tools", "Permanent resolution"]
            },
            {
                "question": "How do you handle production issues or tight deadlines when requirements change unexpectedly in your projects?",
                "category": "Scenario",
                "intent": "Adaptability and pressure management in high-stakes environments",
                "key_points_to_look_for": ["Prioritization", "Communication", "Resilience"]
            },
            {
                "question": "Describe a situation where you had a disagreement with a teammate or stakeholder on technical design. How was it resolved?",
                "category": "Behavioral",
                "intent": "Team collaboration and constructive conflict resolution",
                "key_points_to_look_for": ["Empathy", "Constructive dialogue", "Outcome"]
            },
            {
                "question": "How do you approach ensuring system reliability, automated testing, and scalability in the features and services you deliver?",
                "category": "Technical",
                "intent": "Software engineering standards and quality assurance",
                "key_points_to_look_for": ["Test coverage", "Scalability considerations", "Maintainability"]
            },
            {
                "question": "Given the domain requirements of this role, what modern tools or emerging methodologies are you currently exploring to enhance your skill set?",
                "category": "Technical",
                "intent": "Self-awareness, curiosity, and continuous learning agility",
                "key_points_to_look_for": ["Learning agility", "Industry awareness", "Growth mindset"]
            }
        ]

    # Always ensure hardcoded foundational questions are at the beginning
    final_questions = list(hardcoded_questions)
    for q in generated:
        q_text = q.get("question", "").lower()
        if (
            "introduce yourself" in q_text
            or "tell me about yourself" in q_text
            or "why you apply" in q_text
            or "why did you apply" in q_text
            or "expectations" in q_text
        ):
            continue
        final_questions.append(q)

    # Trim to requested num_questions (always at least 3)
    final_questions = final_questions[:max(3, num_questions)]

    # Normalize response format & re-index IDs
    for idx, q in enumerate(final_questions, start=1):
        q["id"] = idx
        if "category" not in q:
            q["category"] = "Technical"

    return {
        "questions": final_questions,
        "total_questions": len(final_questions)
    }