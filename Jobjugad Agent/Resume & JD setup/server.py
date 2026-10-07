import http.server
import socketserver
import json
import urllib.parse
import os
import io
import re
import requests
import tempfile
from pypdf import PdfReader
import docx

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
CLAUDE_API_KEY = os.environ.get("CLAUDE_API_KEY", "")

def extract_text_from_pdf(stream):
    try:
        reader = PdfReader(stream)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text.strip()
    except Exception as e:
        return f"Error extracting PDF text: {str(e)}"

def extract_text_from_docx(stream):
    try:
        doc = docx.Document(stream)
        fullText = []
        for para in doc.paragraphs:
            fullText.append(para.text)
        return "\n".join(fullText).strip()
    except Exception as e:
        return f"Error extracting DOCX text: {str(e)}"

def call_groq_llm(prompt, system_message="You are an expert AI HR Recruiter and Resume Parser."):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "qwen/qwen3.6-27b",
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 2048
    }
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=30)
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"]
        else:
            print(f"Groq API Error {res.status_code}: {res.text}")
            # Try fallback model
            payload["model"] = "groq/compound"
            res_fb = requests.post(url, headers=headers, json=payload, timeout=30)
            if res_fb.status_code == 200:
                return res_fb.json()["choices"][0]["message"]["content"]
            return None
    except Exception as e:
        print(f"Groq API call exception: {e}")
        return None

def call_gemini_llm(prompt, system_message="You are an expert AI HR Recruiter."):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [{"text": f"{system_message}\n\n{prompt}"}]
        }]
    }
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=30)
        if res.status_code == 200:
            data = res.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        else:
            print(f"Gemini API Error {res.status_code}: {res.text}")
            return None
    except Exception as e:
        print(f"Gemini API Exception: {e}")
        return None

def call_ai_provider(prompt, system_message="You are Eliora, an elite AI HR Manager and Recruitment Analyst. Respond ONLY with valid raw JSON. Do not include thinking, reasoning, markdown tags or preambles.", preferred_provider="groq"):
    """Tries Groq first (fastest & high accuracy), then Gemini as fallback."""
    response = None
    if preferred_provider == "groq" or preferred_provider == "auto":
        response = call_groq_llm(prompt, system_message)
    
    if not response and (preferred_provider == "gemini" or preferred_provider == "auto" or not response):
        response = call_gemini_llm(prompt, system_message)
        
    if not response:
        # Final safety fallback using Groq with fast model
        response = call_groq_llm(prompt, system_message)
        
    return response

def clean_json_response(raw_text):
    if not raw_text:
        return {}
    cleaned = raw_text.strip()
    
    # Remove reasoning <think>...</think> tags if present
    cleaned = re.sub(r'<think>.*?</think>', '', cleaned, flags=re.DOTALL).strip()
        
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    
    # Attempt 1: Direct JSON parse
    try:
        return json.loads(cleaned)
    except Exception:
        pass
        
    # Attempt 2: Extract JSON object via regex
    match = re.search(r'(\{.*\}|\[.*\])', cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass
            
    return {"raw_response": raw_text}

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        endpoint = parsed_path.path

        if endpoint == "/api/upload":
            self.handle_file_upload()
        elif endpoint == "/api/extract-resume":
            self.handle_extract_resume()
        elif endpoint == "/api/analyze-alignment":
            self.handle_analyze_alignment()
        elif endpoint == "/api/generate-questions":
            self.handle_generate_questions()
        elif endpoint == "/api/evaluate-response":
            self.handle_evaluate_response()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_file_upload(self):
        try:
            content_type = self.headers.get('Content-Type')
            if not content_type:
                self.send_json({"error": "Missing Content-Type header"}, 400)
                return

            # Read content bytes
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)

            filename = "document"
            file_bytes = b""
            
            # Simple multipart/form-data parser or direct binary payload
            if "boundary=" in content_type:
                boundary = content_type.split("boundary=")[1].encode()
                parts = post_data.split(b"--" + boundary)
                for part in parts:
                    if b'filename="' in part:
                        header_part, content_part = part.split(b"\r\n\r\n", 1)
                        content_part = content_part.rsplit(b"\r\n", 1)[0]
                        file_bytes = content_part
                        # extract filename
                        match = re.search(r'filename="([^"]+)"', header_part.decode('utf-8', errors='ignore'))
                        if match:
                            filename = match.group(1)
                        break
            else:
                file_bytes = post_data
                filename = self.headers.get('X-File-Name', 'document.txt')

            extracted_text = ""
            ext = os.path.splitext(filename)[1].lower()

            if ext == ".pdf":
                extracted_text = extract_text_from_pdf(io.BytesIO(file_bytes))
            elif ext in [".docx", ".doc"]:
                extracted_text = extract_text_from_docx(io.BytesIO(file_bytes))
            else:
                try:
                    extracted_text = file_bytes.decode('utf-8', errors='ignore')
                except Exception as e:
                    extracted_text = str(file_bytes)

            self.send_json({
                "success": True,
                "filename": filename,
                "text": extracted_text,
                "length": len(extracted_text)
            })
        except Exception as e:
            self.send_json({"success": False, "error": str(e)}, 500)

    def handle_extract_resume(self):
        body = self.read_json_body()
        resume_text = body.get("resume_text", "")
        provider = body.get("provider", "groq")

        if not resume_text or len(resume_text.strip()) < 10:
            self.send_json({"error": "Please provide valid resume text to parse."}, 400)
            return

        prompt = f"""
Parse the following resume text into structured JSON format.

RESUME TEXT:
{resume_text[:4000]}

Return strictly valid JSON with this schema:
{{
  "candidate_name": "Full Name",
  "email": "Email or N/A",
  "phone": "Phone or N/A",
  "total_experience": "e.g. 5+ Years",
  "primary_role": "e.g. Senior Software Engineer",
  "top_skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6"],
  "education": ["Degree, University"],
  "key_achievements": ["Achievement 1", "Achievement 2"],
  "summary": "Brief 2-sentence professional executive summary"
}}
"""
        raw_res = call_ai_provider(prompt, "You are an expert ATS & Resume Parser. Return JSON only.", provider)
        parsed_data = clean_json_response(raw_res)

        # Fallback: if the model didn't return a usable name, pull it from the resume text itself
        name = parsed_data.get("candidate_name")
        if not name or name.strip() in ("", "Full Name", "N/A"):
            parsed_data["candidate_name"] = self.guess_name_from_resume(resume_text) or "Candidate"

        self.send_json({"success": True, "data": parsed_data})

    def guess_name_from_resume(self, resume_text):
        """Best-effort extraction of the candidate's name from raw resume text."""
        if not resume_text:
            return None
        for raw_line in resume_text.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            # Skip lines that are clearly not a name
            if any(ch.isdigit() for ch in line):
                continue
            if "@" in line or "http" in line.lower():
                continue
            lowered = line.lower()
            if any(kw in lowered for kw in ("resume", "curriculum", "vitae", "cv", "profile", "summary", "objective", "address")):
                continue
            words = line.split()
            if 1 < len(words) <= 4 and all(w[0].isalpha() for w in words) and len(line) <= 40:
                return " ".join(w.capitalize() for w in words)
        return None

    def handle_analyze_alignment(self):
        body = self.read_json_body()
        resume_text = body.get("resume_text", "")
        jd_text = body.get("jd_text", "")
        provider = body.get("provider", "groq")

        if not resume_text or not jd_text:
            self.send_json({"error": "Both Resume and Job Description text are required for alignment analysis."}, 400)
            return

        prompt = f"""
Analyze the match alignment between the candidate's Resume and the target Job Description (JD).

RESUME:
{resume_text[:3500]}

JOB DESCRIPTION:
{jd_text[:3500]}

Return strictly valid JSON with this schema:
{{
  "overall_match_score": 85,
  "skills_match_score": 88,
  "experience_match_score": 82,
  "domain_match_score": 85,
  "fit_level": "Strong Match | Moderate Match | Potential Fit | Low Alignment",
  "matching_key_skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
  "missing_or_gap_skills": ["Gap 1", "Gap 2", "Gap 3"],
  "strengths": [
    "Key strength 1 relative to JD",
    "Key strength 2 relative to JD",
    "Key strength 3 relative to JD"
  ],
  "concerns_or_gaps": [
    "Potential risk or missing requirement 1",
    "Potential risk or missing requirement 2"
  ],
  "recommendations": [
    "Recommendation for interview focus area 1",
    "Recommendation for interview focus area 2"
  ]
}}
"""
        raw_res = call_ai_provider(prompt, "You are Eliora, Lead Recruitment Analytics AI. Return JSON only.", provider)
        parsed_data = clean_json_response(raw_res)
        
        self.send_json({"success": True, "data": parsed_data})

    def handle_generate_questions(self):
        body = self.read_json_body()
        candidate_name = body.get("candidate_name", "Candidate")
        job_title = body.get("job_title", "Senior Software Engineer")
        num_questions = int(body.get("num_questions", 10))
        accent = body.get("accent", "Indian")
        resume_text = body.get("resume_text", "")
        jd_text = body.get("jd_text", "")
        provider = body.get("provider", "groq")

        prompt = f"""
Generate {num_questions} tailored AI HR & Technical Interview Questions for candidate "{candidate_name}" applying for the role of "{job_title}".

The first 3 questions must be foundational:
1. Introduce yourself, education background, skills
2. Why you apply for this role?
3. What are your expectations?

The remaining {max(0, num_questions - 3)} questions must be deeply tailored to the candidate's resume domain and the Job Description context.

RESUME CONTEXT:
{resume_text[:2000] if resume_text else 'Standard resume for ' + job_title}

JOB DESCRIPTION CONTEXT:
{jd_text[:2000] if jd_text else 'Standard requirements for ' + job_title}

Return strictly valid JSON with this schema:
{{
  "session_id": "session_12345",
  "candidate_name": "{candidate_name}",
  "job_title": "{job_title}",
  "accent": "{accent}",
  "total_questions": {num_questions},
  "questions": [
    {{
      "id": 1,
      "category": "Icebreaker & Background | Technical Core | System Design & Problem Solving | Behavioral & Leadership | Role Fit",
      "question": "Clear, professional, natural interview question sentence...",
      "key_eval_points": ["Point 1 to look for in candidate answer", "Point 2", "Point 3"],
      "ideal_answer_outline": "Summary of what a 10/10 response should include."
    }}
  ]
}}
"""
        raw_res = call_ai_provider(prompt, "You are Eliora, Elite AI HR Manager. Generate highly relevant questions. Return JSON only.", provider)
        parsed_data = clean_json_response(raw_res)
        
        self.send_json({"success": True, "data": parsed_data})

    def handle_evaluate_response(self):
        body = self.read_json_body()
        question = body.get("question", "")
        candidate_answer = body.get("candidate_answer", "")
        job_title = body.get("job_title", "Senior Software Engineer")
        eval_points = body.get("key_eval_points", [])
        provider = body.get("provider", "groq")

        prompt = f"""
Evaluate the candidate's interview response for the role of "{job_title}".

QUESTION ASKED:
"{question}"

CANDIDATE'S ANSWER:
"{candidate_answer}"

EXPECTED EVALUATION CRITERIA:
{json.dumps(eval_points)}

Return strictly valid JSON:
{{
  "score": 8,
  "rating": "Excellent | Good | Average | Needs Improvement",
  "positive_feedback": "What candidate did well in their answer",
  "areas_for_improvement": "What was missing or could be strengthened",
  "suggested_follow_up": "Optional follow-up question or tip"
}}
"""
        raw_res = call_ai_provider(prompt, "You are Eliora, AI HR Interviewer evaluating candidate responses in real-time. Return JSON only.", provider)
        parsed_data = clean_json_response(raw_res)
        
        self.send_json({"success": True, "data": parsed_data})

    def read_json_body(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            return json.loads(body_bytes.decode('utf-8'))
        except Exception:
            return {}

    def send_json(self, data, code=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

if __name__ == "__main__":
    print(f"Starting Resume & JD Setup Server on http://localhost:{PORT}")
    with socketserver.TCPServer(("", PORT), RequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping server.")
