import json
import time
from typing import List, Dict, Any, Optional
from llm import get_openai_client

# Difficulty distribution for the 5-question coding round: 2 Easy, 2 Moderate, 1 Hard.
DIFFICULTY_SEQUENCE = ["Easy", "Easy", "Moderate", "Moderate", "Hard"]

# Zero-latency / offline fallback pools, keyed by language. Each has MORE than
# 5 entries per language so a fallback round can still vary between attempts
# (randomly sampled per difficulty slot), matching the same 2E/2M/1H shape as
# the LLM-generated set.
FALLBACK_PYTHON_POOL = {
    "Easy": [
        {
            "title": "Second Largest in a List",
            "tags": ["arrays", "loops"],
            "problem_statement": "Write a function `second_largest(nums)` that takes a list of integers and returns the second largest unique value.",
            "input_format": "A list of integers `nums` (may contain duplicates).",
            "output_format": "A single integer: the second largest unique value in the list.",
            "example_input": "nums = [4, 1, 7, 7, 3]",
            "example_output": "4",
            "starter_code": "def second_largest(nums):\n    # your code here\n    pass\n",
            "eval_points": ["Handles duplicate values correctly", "Does not rely on sort() without justification", "Handles lists with fewer than 2 unique values"]
        },
        {
            "title": "Count Word Frequency",
            "tags": ["strings", "dictionaries"],
            "problem_statement": "Write a function `word_frequency(text)` that returns a dictionary mapping each word in the given string to how many times it appears (case-insensitive).",
            "input_format": "A single string `text` containing words separated by spaces.",
            "output_format": "A dictionary mapping each lowercase word to its occurrence count.",
            "example_input": "text = 'the cat sat on the mat'",
            "example_output": "{'the': 2, 'cat': 1, 'sat': 1, 'on': 1, 'mat': 1}",
            "starter_code": "def word_frequency(text):\n    # your code here\n    pass\n",
            "eval_points": ["Correct use of a dictionary", "Case-insensitive comparison", "Reasonable tokenisation/splitting of the string"]
        },
        {
            "title": "Check Balanced Parentheses",
            "tags": ["strings", "stack"],
            "problem_statement": "Write a function `is_balanced(s)` that returns True if every opening bracket `( [ {` in the string has a matching, correctly-ordered closing bracket, else False.",
            "input_format": "A string `s` containing brackets and possibly other characters.",
            "output_format": "A boolean: True if brackets are balanced, else False.",
            "example_input": "s = '{[()()]}'",
            "example_output": "True",
            "starter_code": "def is_balanced(s):\n    # your code here\n    pass\n",
            "eval_points": ["Uses a stack (list) to track open brackets", "Correctly matches bracket types, not just counts", "Handles empty string and unmatched closing brackets"]
        }
    ],
    "Moderate": [
        {
            "title": "Group Anagrams",
            "tags": ["strings", "hashing"],
            "problem_statement": "Write a function `group_anagrams(words)` that groups a list of strings into lists of anagrams of each other, returned as a list of lists.",
            "input_format": "A list of lowercase strings `words`.",
            "output_format": "A list of lists, each containing words that are anagrams of one another (order within/between groups does not matter).",
            "example_input": "words = ['eat','tea','tan','ate','nat','bat']",
            "example_output": "[['eat','tea','ate'], ['tan','nat'], ['bat']]",
            "starter_code": "def group_anagrams(words):\n    # your code here\n    pass\n",
            "eval_points": ["Uses a suitable key (e.g. sorted letters) to group words", "Uses a dictionary/defaultdict effectively", "Correctly handles words of different lengths"]
        },
        {
            "title": "Flatten a Nested List",
            "tags": ["recursion", "arrays"],
            "problem_statement": "Write a function `flatten(nested)` that takes an arbitrarily nested list (lists within lists) and returns a single flat list of all the values, preserving order.",
            "input_format": "A list `nested` that may contain integers and/or further nested lists to any depth.",
            "output_format": "A single flat list of integers in the original left-to-right order.",
            "example_input": "nested = [1, [2, [3, 4], 5], 6]",
            "example_output": "[1, 2, 3, 4, 5, 6]",
            "starter_code": "def flatten(nested):\n    # your code here\n    pass\n",
            "eval_points": ["Uses recursion or an explicit stack to handle arbitrary nesting depth", "Correctly checks whether an element is itself a list", "Preserves the original left-to-right order"]
        },
        {
            "title": "Maximum Subarray Sum",
            "tags": ["arrays", "dynamic-programming"],
            "problem_statement": "Write a function `max_subarray(nums)` that returns the largest possible sum of a contiguous subarray (containing at least one number).",
            "input_format": "A list of integers `nums` (may include negative numbers).",
            "output_format": "A single integer: the maximum contiguous subarray sum.",
            "example_input": "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
            "example_output": "6",
            "starter_code": "def max_subarray(nums):\n    # your code here\n    pass\n",
            "eval_points": ["Uses an efficient single-pass approach (e.g. Kadane's algorithm) rather than brute force where reasonable", "Correctly handles an all-negative list", "Correctly tracks a running/current sum vs. a global best"]
        }
    ],
    "Hard": [
        {
            "title": "Print a Number Pyramid Pattern",
            "tags": ["loops", "patterns"],
            "problem_statement": "Write a function `number_pyramid(n)` that returns a list of strings, where row i (1-indexed) contains the numbers 1 to i separated by spaces, forming a pyramid.",
            "input_format": "A positive integer `n` for the number of rows.",
            "output_format": "A list of strings representing each row of the pyramid.",
            "example_input": "n = 4",
            "example_output": "['1', '1 2', '1 2 3', '1 2 3 4']",
            "starter_code": "def number_pyramid(n):\n    # your code here\n    pass\n",
            "eval_points": ["Correct nested loop / range logic", "Correctly joins numbers with single spaces", "Handles n=1 and edge cases without off-by-one errors"]
        },
        {
            "title": "LRU Cache",
            "tags": ["design", "hashing", "linked-list"],
            "problem_statement": "Implement a class `LRUCache(capacity)` with methods `get(key)` (returns the value or -1 if absent, and marks it as recently used) and `put(key, value)` (inserts/updates a value, evicting the least recently used entry when over capacity).",
            "input_format": "A sequence of `get`/`put` operations on an LRUCache of a given capacity.",
            "output_format": "The return values of each `get` call, in order.",
            "example_input": "cache = LRUCache(2); cache.put(1,1); cache.put(2,2); cache.get(1); cache.put(3,3) # evicts key 2; cache.get(2)",
            "example_output": "get(1) -> 1, get(2) -> -1 (evicted)",
            "starter_code": "class LRUCache:\n    def __init__(self, capacity):\n        # your code here\n        pass\n\n    def get(self, key):\n        pass\n\n    def put(self, key, value):\n        pass\n",
            "eval_points": ["Uses an ordered structure (e.g. OrderedDict or dict + doubly linked list) for O(1) operations", "Correctly updates recency on both get and put", "Correctly evicts the least recently used entry only when over capacity"]
        }
    ]
}

FALLBACK_SQL_POOL = {
    "Easy": [
        {
            "title": "Select Active Customers",
            "tags": ["select", "where"],
            "problem_statement": "Write a SQL query to select the `name` and `email` of all customers whose status is 'active'.",
            "input_format": "Table `customers(id, name, email, status)`.",
            "output_format": "Columns `name`, `email` for rows where `status = 'active'`.",
            "example_input": "customers: (1,'Amy','a@x.com','active'), (2,'Bo','b@x.com','inactive')",
            "example_output": "('Amy', 'a@x.com')",
            "starter_code": "-- write your SQL query here\n",
            "eval_points": ["Correct SELECT column list", "Correct WHERE filter on status", "Valid, runnable SQL syntax"]
        },
        {
            "title": "Products Above a Price Threshold",
            "tags": ["select", "where", "order-by"],
            "problem_statement": "Write a SQL query that returns the `name` and `price` of all products priced above 100, ordered from most to least expensive.",
            "input_format": "Table `products(id, name, price)`.",
            "output_format": "Columns `name`, `price`, filtered to price > 100, ordered by price descending.",
            "example_input": "products: (1,'Widget',50), (2,'Gadget',150)",
            "example_output": "('Gadget', 150)",
            "starter_code": "-- write your SQL query here\n",
            "eval_points": ["Correct WHERE filter (price > 100)", "ORDER BY price DESC", "Selects only the required columns"]
        }
    ],
    "Moderate": [
        {
            "title": "Count Orders per Customer",
            "tags": ["join", "group-by", "aggregate"],
            "problem_statement": "Write a SQL query that returns each customer's `name` and the total number of orders they placed, including customers with zero orders.",
            "input_format": "Tables `customers(id, name)` and `orders(id, customer_id, amount)`.",
            "output_format": "Columns `name`, `order_count` for every customer, with 0 for customers who placed no orders.",
            "example_input": "customers: (1,'Amy'), (2,'Bo'); orders: (1,1,50)",
            "example_output": "('Amy', 1), ('Bo', 0)",
            "starter_code": "-- write your SQL query here\n",
            "eval_points": ["Uses a LEFT JOIN from customers to orders", "Uses GROUP BY on the customer", "Uses COUNT correctly so zero-order customers show 0, not are excluded"]
        },
        {
            "title": "Top Spending Customers",
            "tags": ["join", "group-by", "order-by", "limit"],
            "problem_statement": "Write a SQL query that returns the top 3 customers by total order amount, showing `name` and `total_spent`, ordered highest first.",
            "input_format": "Tables `customers(id, name)` and `orders(id, customer_id, amount)`.",
            "output_format": "Columns `name`, `total_spent` for the top 3 customers by total spend, descending.",
            "example_input": "customers: (1,'Amy'), (2,'Bo'); orders: (1,1,300), (2,2,120)",
            "example_output": "('Amy', 300), ('Bo', 120)",
            "starter_code": "-- write your SQL query here\n",
            "eval_points": ["JOIN between customers and orders", "SUM(amount) aliased as total_spent", "GROUP BY customer, ORDER BY total_spent DESC, LIMIT 3"]
        }
    ],
    "Hard": [
        {
            "title": "Customers Above Average Spend",
            "tags": ["subquery", "aggregate", "having"],
            "problem_statement": "Write a SQL query that returns the names of customers whose total order amount is strictly greater than the average total order amount across all customers.",
            "input_format": "Tables `customers(id, name)` and `orders(id, customer_id, amount)`.",
            "output_format": "Column `name` for customers whose total spend exceeds the average total spend across all customers.",
            "example_input": "customers: (1,'Amy'), (2,'Bo'), (3,'Cy'); orders: (1,1,300), (2,2,50), (3,3,10)",
            "example_output": "('Amy',)",
            "starter_code": "-- write your SQL query here\n",
            "eval_points": ["Correctly aggregates total spend per customer (subquery or CTE)", "Compares against an average computed across all customers, not per row", "Valid use of HAVING or a subquery in WHERE"]
        },
        {
            "title": "Monthly Revenue Trend",
            "tags": ["group-by", "date-functions", "aggregate"],
            "problem_statement": "Write a SQL query that returns total revenue per calendar month (year-month) across all orders, ordered chronologically.",
            "input_format": "Table `orders(id, customer_id, amount, order_date)`.",
            "output_format": "Columns `year_month`, `total_revenue`, one row per month, ordered chronologically.",
            "example_input": "orders: (1,1,100,'2024-01-05'), (2,1,50,'2024-01-20'), (3,2,80,'2024-02-02')",
            "example_output": "('2024-01', 150), ('2024-02', 80)",
            "starter_code": "-- write your SQL query here\n",
            "eval_points": ["Correctly extracts/truncates the date to year-month", "Uses SUM(amount) and GROUP BY the month expression", "Orders results chronologically"]
        }
    ]
}


def _pick_fallback_pool(primary_language: str) -> Dict[str, List[Dict[str, Any]]]:
    lang = (primary_language or "").strip().lower()
    if "sql" in lang or "database" in lang:
        return FALLBACK_SQL_POOL
    return FALLBACK_PYTHON_POOL


def _build_random_fallback(primary_language: str) -> List[Dict[str, Any]]:
    """Randomly samples one question per difficulty slot from the fallback pool
    so that even offline/rate-limited sessions get some question variety."""
    import random
    pool = _pick_fallback_pool(primary_language)
    picks = []
    for difficulty in ["Easy", "Easy", "Moderate", "Moderate", "Hard"]:
        bucket = pool.get(difficulty, [])
        if not bucket:
            continue
        picks.append(dict(random.choice(bucket)))
    # Ensure exactly 5 by cycling the pool if a bucket ran short
    while len(picks) < 5:
        all_q = [q for bucket in pool.values() for q in bucket]
        if not all_q:
            break
        picks.append(dict(random.choice(all_q)))
    return picks[:5]


def _guess_primary_language(resume_text: str, jd_text: str, target_role: str) -> str:
    """Lightweight keyword heuristic used only for picking a fallback question
    pool when the LLM call fails entirely. The LLM call itself does the real
    domain-aware reasoning."""
    blob = f"{target_role or ''} {jd_text or ''}".lower()
    analyst_kw = ["data analyst", "business analyst", "bi analyst", "business intelligence"]
    if any(kw in blob for kw in analyst_kw):
        return "SQL"
    return "Python"


def _compose_full_prompt(q: Dict[str, Any]) -> str:
    """Builds one readable problem statement string from the structured fields,
    used for LLM grading context and as a display fallback."""
    parts = [q.get("problem_statement", "")]
    if q.get("input_format"):
        parts.append(f"Input: {q['input_format']}")
    if q.get("output_format"):
        parts.append(f"Output: {q['output_format']}")
    if q.get("example_input") or q.get("example_output"):
        parts.append(f"Example: {q.get('example_input', '')} -> {q.get('example_output', '')}")
    return "\n".join(p for p in parts if p)


def _finalize_questions(questions: List[Dict[str, Any]], language_hint: str) -> List[Dict[str, Any]]:
    """Normalize a 5-question list: enforce ids, difficulty sequence and required fields."""
    final = []
    for idx, q in enumerate(questions[:5]):
        q = dict(q)
        q["id"] = idx + 1
        q["difficulty"] = DIFFICULTY_SEQUENCE[idx]
        q.setdefault("language", language_hint)
        q.setdefault("title", f"Question {idx + 1}")
        q.setdefault("tags", [])
        q.setdefault("problem_statement", q.get("prompt", ""))
        q.setdefault("input_format", "")
        q.setdefault("output_format", "")
        q.setdefault("example_input", "")
        q.setdefault("example_output", "")
        q.setdefault("starter_code", "")
        q.setdefault("eval_points", [])
        q["prompt"] = _compose_full_prompt(q)
        final.append(q)
    return final


def generate_coding_questions(
    resume_text: str = "",
    jd_text: Optional[str] = None,
    target_role: Optional[str] = None,
    candidate_name: Optional[str] = None,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a 5-question hands-on coding round tailored to the candidate's
    resume and target role. The LLM first determines which single programming
    language/technology is actually central to day-to-day work in that role
    (e.g. a Data Scientist is tested on Python even if other languages are
    listed on the resume; a Data Analyst is tested primarily on SQL with
    little to no core-language coding), then writes 5 original coding
    problems: 2 Easy, 2 Moderate, 1 Hard.
    """
    client = get_openai_client(api_key)
    role_ctx = target_role or "Software Engineer"
    timestamp_seed = int(time.time() * 1000) % 100000

    prompt = f"""You are an expert technical interviewer designing a hands-on coding round.

Candidate Target Role: {role_ctx}

Candidate Resume:
{(resume_text or "No resume text provided.")[:4000]}

Job Description (if any):
{(jd_text or "Not provided.")[:2000]}

Random Session Seed: {timestamp_seed} (use this to make the problems genuinely different from any previous session — vary the specific problems, numbers, and scenarios each time, even for the same resume)

STEP 1 — Decide the coding focus:
Determine the ONE primary programming language or technology that is actually central to DAY-TO-DAY hands-on work in this specific role, based on the target role and resume. Do not simply pick whatever language is listed first or most often on the resume — reason about what the job itself actually requires:
- Data Scientist / Machine Learning Engineer / AI Engineer -> primary language is Python, even if the resume lists Java, C++, R, etc. Core Python data-structure and pattern questions are appropriate.
- Data Analyst / Business Intelligence Analyst -> the role needs almost NO core-language coding; the primary focus MUST be SQL (writing real queries: SELECT, JOIN, GROUP BY, aggregates, subqueries). Do not ask deep core-Python questions for this role.
- Full Stack / Frontend / Backend / Web Developer -> primary language is JavaScript/TypeScript, or the specific backend application language clearly emphasized in the resume (e.g. Python+Django, Java+Spring, Node.js) for a backend-only role.
- DevOps / Cloud / SRE -> primary language is Python or Bash/Shell scripting, whichever is more clearly evidenced in the resume.
- For any other role, infer the single most job-relevant language from the resume and target role.

IMPORTANT — do not over-index on SQL: merely using a SQL database (e.g. PostgreSQL, MySQL) as an application's data store does NOT make SQL the primary language. A Backend/Full Stack/Software Engineer who lists a framework like Django, Flask, Spring, Express, or similar is a software builder — their primary language is that application language (e.g. Python for Django/Flask), not SQL, even though their app happens to talk to a SQL database. SQL should only be chosen as the PRIMARY focus for roles that are fundamentally about querying/analyzing data rather than building software: Data Analyst, Business Intelligence Analyst, Reporting Analyst, Database Administrator.

If — and only if — the resume or job description explicitly and prominently lists a second, clearly job-relevant skill (for example a Data Scientist role where the resume also explicitly lists strong SQL experience, or a backend developer role that explicitly calls out heavy hand-written SQL query/reporting work), you may make ONE of the 5 questions test that secondary skill instead of the primary language. Otherwise all 5 questions must be in the primary language.

STEP 2 — Write exactly 5 original, hands-on coding problems (NOT multiple choice, NOT trivia — the candidate must write real code/query to solve each one):
- Question 1: Easy
- Question 2: Easy
- Question 3: Moderate
- Question 4: Moderate
- Question 5: Hard
For Python questions, prefer practical problems involving lists, tuples, dictionaries, strings, loops, simple algorithms, or pattern generation. For SQL questions, describe a small example table schema in `input_format` and ask the candidate to write a query (SELECT / JOIN / GROUP BY / aggregate / subquery as appropriate for the difficulty). Give 2-3 short topic tags per question (e.g. ["arrays","hashing"] or ["join","group-by"]).

Return ONLY valid JSON with this exact schema:
{{
  "primary_language": "Python",
  "secondary_language": null,
  "questions": [
    {{
      "id": 1,
      "title": "Short descriptive title",
      "language": "python",
      "difficulty": "Easy",
      "tags": ["arrays", "loops"],
      "problem_statement": "The core problem description (1-3 sentences), without repeating the input/output/example below.",
      "input_format": "What the input consists of (for SQL: describe the table schema here).",
      "output_format": "What the output/result should be.",
      "example_input": "A concrete example input value or sample rows.",
      "example_output": "The expected output for that example.",
      "starter_code": "def function_name(args):\\n    # your code here\\n    pass\\n",
      "eval_points": ["What a correct, well-written solution must do", "Another key thing to check for"]
    }}
  ]
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert technical interview question designer. Output only valid JSON without preamble or markdown wraps."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        questions = data.get("questions", [])
        primary_language = data.get("primary_language") or _guess_primary_language(resume_text, jd_text or "", target_role or "")

        if len(questions) < 5:
            raise ValueError(f"LLM returned {len(questions)} questions instead of 5")

        final_questions = _finalize_questions(questions, primary_language)

        return {
            "status": "success",
            "primary_language": primary_language,
            "secondary_language": data.get("secondary_language"),
            "total_questions": len(final_questions),
            "questions": final_questions
        }

    except Exception as e:
        print(f"Error generating coding round questions: {e}. Using fallback question pool.")
        primary_language = _guess_primary_language(resume_text, jd_text or "", target_role or "")
        fallback = _finalize_questions(_build_random_fallback(primary_language), primary_language.lower())
        return {
            "status": "success",
            "primary_language": primary_language,
            "secondary_language": None,
            "total_questions": len(fallback),
            "questions": fallback
        }


def evaluate_coding_submission(
    questions: List[Dict[str, Any]],
    submissions: Dict[str, str],
    time_taken_seconds: int = 0,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends every question + the candidate's submitted code to the LLM for review
    (no code execution — purely a static read-and-judge review, per spec) and
    returns a per-question breakdown plus an overall score/verdict/summary in
    the same general shape as the aptitude round's evaluation, so it can be
    blended into the final interview report the same way.
    """
    client = get_openai_client(api_key)

    qa_pairs = []
    for q in questions:
        qid = str(q.get("id"))
        code = (submissions.get(qid) or submissions.get(int(qid) if qid.isdigit() else qid) or "").strip()
        full_prompt = q.get("prompt") or _compose_full_prompt(q)
        qa_pairs.append({
            "id": q.get("id"),
            "title": q.get("title"),
            "language": q.get("language"),
            "difficulty": q.get("difficulty"),
            "tags": q.get("tags", []),
            "prompt": full_prompt,
            "eval_points": q.get("eval_points", []),
            "candidate_code": code if code else "[No code submitted]"
        })

    prompt = f"""You are an expert technical interviewer reviewing a candidate's coding round submission.
You are grading by READING the code only — there is no code execution environment, so judge correctness by careful manual tracing/reasoning about the logic exactly as an experienced engineer doing a code review would.

For each of the following 5 questions, review the candidate's submitted code against the problem statement and evaluation points, then score it.

Questions and Submissions:
{json.dumps(qa_pairs, indent=2)}

SCORING RULES:
- If no code was submitted (or it's empty/placeholder-only), correctness_score and code_quality_score MUST both be 0, and verdict MUST be "Not Attempted".
- If the code is present but fundamentally wrong or would not solve the problem, score correctness_score between 0 and 30.
- If the code is a partially correct/incomplete approach, score correctness_score between 30 and 65.
- Only score correctness_score above 75 if the logic would actually solve the problem correctly for the given examples and reasonable edge cases.
- code_quality_score (0-100) should reflect readability, naming, and reasonable structure, independent of correctness.

Return ONLY valid JSON with this exact schema:
{{
  "per_question": [
    {{
      "id": 1,
      "is_attempted": true,
      "correctness_score": 85,
      "code_quality_score": 80,
      "verdict": "Correct | Partially Correct | Incorrect | Not Attempted",
      "feedback": "2-3 sentence explanation of what is right or wrong with the submitted code.",
      "issues": ["Specific bug or gap 1"],
      "suggestions": ["Concrete improvement suggestion 1"]
    }}
  ],
  "summary": "3-4 sentence overall summary of the candidate's coding round performance, referencing the specific language tested.",
  "verdict": "Excellent | Good | Average | Needs Improvement"
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a rigorous senior engineer performing a code review. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        per_question = data.get("per_question", [])
        if not per_question:
            raise ValueError("LLM returned no per-question evaluations")
    except Exception as e:
        print(f"Error evaluating coding submission: {e}. Using neutral fallback scoring.")
        per_question = []
        for q in qa_pairs:
            attempted = q["candidate_code"] != "[No code submitted]"
            per_question.append({
                "id": q["id"],
                "is_attempted": attempted,
                "correctness_score": 55 if attempted else 0,
                "code_quality_score": 55 if attempted else 0,
                "verdict": "Partially Correct" if attempted else "Not Attempted",
                "feedback": "Automated review unavailable; a manual review is recommended." if attempted else "No code was submitted for this question.",
                "issues": [],
                "suggestions": []
            })
        data = {
            "summary": "Automated code review was unavailable for this session; scores reflect a neutral placeholder and a manual review is recommended.",
            "verdict": "Average"
        }

    # Build detailed_review merging original question context with the LLM's per-question judgement
    detailed_review = []
    per_question_by_id = {str(pq.get("id")): pq for pq in per_question}
    difficulty_stats: Dict[str, Dict[str, Any]] = {}
    weighted_scores = []

    for q in qa_pairs:
        qid = str(q["id"])
        pq = per_question_by_id.get(qid, {})
        correctness = int(pq.get("correctness_score", 0))
        quality = int(pq.get("code_quality_score", 0))
        question_score = round(correctness * 0.8 + quality * 0.2, 1)
        weighted_scores.append(question_score)

        difficulty = q["difficulty"] or "Moderate"
        bucket = difficulty_stats.setdefault(difficulty, {"total": 0, "score_sum": 0.0})
        bucket["total"] += 1
        bucket["score_sum"] += question_score

        detailed_review.append({
            "id": q["id"],
            "title": q["title"],
            "language": q["language"],
            "difficulty": difficulty,
            "tags": q["tags"],
            "prompt": q["prompt"],
            "candidate_code": q["candidate_code"],
            "is_attempted": bool(pq.get("is_attempted", q["candidate_code"] != "[No code submitted]")),
            "correctness_score": correctness,
            "code_quality_score": quality,
            "question_score": question_score,
            "verdict": pq.get("verdict", "Not Attempted"),
            "feedback": pq.get("feedback", ""),
            "issues": pq.get("issues", []),
            "suggestions": pq.get("suggestions", [])
        })

    total_questions = len(qa_pairs)
    score_percentage = round(sum(weighted_scores) / max(1, total_questions), 1)

    difficulty_breakdown = {
        diff.lower(): round(bucket["score_sum"] / max(1, bucket["total"]), 1)
        for diff, bucket in difficulty_stats.items()
    }

    if score_percentage >= 80:
        verdict = data.get("verdict") or "Excellent"
    elif score_percentage >= 60:
        verdict = data.get("verdict") or "Good"
    elif score_percentage >= 40:
        verdict = data.get("verdict") or "Average"
    else:
        verdict = data.get("verdict") or "Needs Improvement"

    return {
        "status": "success",
        "total_questions": total_questions,
        "score_percentage": score_percentage,
        "verdict": verdict,
        "summary": data.get("summary", ""),
        "time_taken_seconds": time_taken_seconds,
        "difficulty_breakdown": difficulty_breakdown,
        "detailed_review": detailed_review
    }
