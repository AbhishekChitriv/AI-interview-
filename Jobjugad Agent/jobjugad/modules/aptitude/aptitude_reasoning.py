import os
import json
import random
import time
from typing import List, Dict, Any, Optional
try:
    from .llm import get_openai_client          # when imported as a package
except ImportError:
    from llm import get_openai_client            # when this folder is on sys.path

# Curated fallback bank for instant zero-latency or offline fallback
# ensuring 10 Aptitude (3 Easy, 4 Moderate, 3 Hard) and 10 Reasoning (3 Easy, 4 Moderate, 3 Hard)
FALLBACK_APTITUDE_POOL = {
    "Easy": [
        {
            "question": "If 15% of a number is 45, what is 40% of that number?",
            "options": ["100", "120", "150", "180"],
            "correct_index": 1,
            "correct_answer": "120",
            "explanation": "Let the number be X. 0.15 * X = 45 => X = 300. 40% of 300 = 0.40 * 300 = 120.",
            "subtopic": "Percentages"
        },
        {
            "question": "A train travels 360 km in 4 hours. What is its speed in meters per second?",
            "options": ["20 m/s", "25 m/s", "30 m/s", "35 m/s"],
            "correct_index": 1,
            "correct_answer": "25 m/s",
            "explanation": "Speed = 360 km / 4 hr = 90 km/h. To convert km/h to m/s, multiply by 5/18: 90 * (5/18) = 25 m/s.",
            "subtopic": "Speed, Time & Distance"
        },
        {
            "question": "The ratio of boys to girls in a class of 60 students is 3:2. How many girls are there in the class?",
            "options": ["20", "24", "36", "40"],
            "correct_index": 1,
            "correct_answer": "24",
            "explanation": "Total parts = 3 + 2 = 5 parts. 1 part = 60 / 5 = 12. Number of girls = 2 parts = 2 * 12 = 24.",
            "subtopic": "Ratio & Proportion"
        },
        {
            "question": "A shopkeeper buys an article for $250 and sells it for $300. What is the profit percentage?",
            "options": ["15%", "20%", "25%", "30%"],
            "correct_index": 1,
            "correct_answer": "20%",
            "explanation": "Profit = $300 - $250 = $50. Profit% = (50 / 250) * 100 = 20%.",
            "subtopic": "Profit & Loss"
        },
        {
            "question": "What is the average of the first five prime numbers (2, 3, 5, 7, 11)?",
            "options": ["5.2", "5.6", "6.0", "6.4"],
            "correct_index": 1,
            "correct_answer": "5.6",
            "explanation": "Sum = 2 + 3 + 5 + 7 + 11 = 28. Average = 28 / 5 = 5.6.",
            "subtopic": "Averages"
        }
    ],
    "Moderate": [
        {
            "question": "Pipe A can fill a tank in 12 hours and Pipe B can fill it in 18 hours. If both pipes are opened together, how long will they take to fill the tank?",
            "options": ["6.5 hours", "7.2 hours", "8 hours", "9.6 hours"],
            "correct_index": 1,
            "correct_answer": "7.2 hours",
            "explanation": "Combined rate = (1/12) + (1/18) = (3 + 2)/36 = 5/36 per hour. Total time = 36 / 5 = 7.2 hours.",
            "subtopic": "Pipes & Cisterns"
        },
        {
            "question": "A man can row at 8 km/h in still water. If the river flows at 2 km/h, it takes him 4 hours to row to a place and return. What is the one-way distance?",
            "options": ["12 km", "15 km", "16 km", "18 km"],
            "correct_index": 1,
            "correct_answer": "15 km",
            "explanation": "Downstream speed = 8 + 2 = 10 km/h. Upstream speed = 8 - 2 = 6 km/h. Distance D: (D/10) + (D/6) = 4 => (3D + 5D)/30 = 4 => 8D = 120 => D = 15 km.",
            "subtopic": "Boats & Streams"
        },
        {
            "question": "A sum of money invested at compound interest doubles itself in 4 years. In how many years will it become 8 times of itself at the same rate?",
            "options": ["8 years", "10 years", "12 years", "16 years"],
            "correct_index": 2,
            "correct_answer": "12 years",
            "explanation": "Money doubles (2^1) in 4 years. To become 8 times (2^3), it takes 3 * 4 = 12 years.",
            "subtopic": "Compound Interest"
        },
        {
            "question": "In a mixture of 80 liters, the ratio of milk to water is 7:3. How much water must be added to make the ratio 2:1?",
            "options": ["4 liters", "6 liters", "8 liters", "10 liters"],
            "correct_index": 0,
            "correct_answer": "4 liters",
            "explanation": "Milk = (7/10)*80 = 56 L, Water = (3/10)*80 = 24 L. For ratio 2:1, Milk / (Water + W) = 2/1 => 56 / (24 + W) = 2 => 24 + W = 28 => W = 4 L.",
            "subtopic": "Mixtures & Alligations"
        },
        {
            "question": "A can do a work in 15 days, and B can do it in 20 days. They work together for 4 days, then A leaves. How many days will B take to finish the remaining work?",
            "options": ["8 days", "10.67 days", "12 days", "14 days"],
            "correct_index": 1,
            "correct_answer": "10.67 days",
            "explanation": "In 4 days, work done = 4 * (1/15 + 1/20) = 4 * (7/60) = 7/15. Remaining work = 8/15. Time taken by B = (8/15) / (1/20) = (8/15) * 20 = 10.67 days (10 2/3 days).",
            "subtopic": "Time & Work"
        }
    ],
    "Hard": [
        {
            "question": "From a pack of 52 cards, two cards are drawn at random without replacement. What is the probability that both are aces?",
            "options": ["1/169", "1/221", "2/221", "4/663"],
            "correct_index": 1,
            "correct_answer": "1/221",
            "explanation": "Probability = (4/52) * (3/51) = (1/13) * (1/17) = 1/221.",
            "subtopic": "Probability"
        },
        {
            "question": "In how many different ways can the letters of the word 'CORPORATION' be arranged so that the vowels always come together?",
            "options": ["25,200", "50,400", "75,600", "100,800"],
            "correct_index": 1,
            "correct_answer": "50,400",
            "explanation": "Vowels in CORPORATION: O, O, A, I, O (5 vowels: 3 O's, 1 A, 1 I). Consonants: C, R, P, R, T, N (6 consonants: 2 R's). Treat 5 vowels as 1 unit. Total units = 6 + 1 = 7 units. Ways to arrange 7 units = 7! / 2! = 2520. Ways to arrange vowels = 5! / 3! = 20. Total ways = 2520 * 20 = 50,400.",
            "subtopic": "Permutations & Combinations"
        },
        {
            "question": "A trader marks his goods 40% above cost price and allows a discount of 25% on the marked price. If he makes an additional 5% profit under the table, what is his effective net profit percentage?",
            "options": ["5%", "9.75%", "10.25%", "12%"],
            "correct_index": 2,
            "correct_answer": "10.25%",
            "explanation": "Let Cost Price = 100. Marked Price = 140. Selling Price after 25% discount = 140 * 0.75 = 105 (5% profit). With additional 5% compounding benefit, Net Profit = 105 * 1.05 = 110.25, giving a net profit of 10.25%.",
            "subtopic": "Advanced Commercial Math"
        },
        {
            "question": "Two circles of radii 10 cm and 8 cm intersect each other and the length of their common chord is 12 cm. What is the distance between their centers?",
            "options": ["13.29 cm", "14.45 cm", "15.12 cm", "16.00 cm"],
            "correct_index": 0,
            "correct_answer": "13.29 cm",
            "explanation": "Half chord = 6 cm. Distance d1 from center of radius 10 = sqrt(10^2 - 6^2) = 8 cm. Distance d2 from center of radius 8 = sqrt(8^2 - 6^2) = sqrt(28) = 5.29 cm. Distance between centers = 8 + 5.29 = 13.29 cm.",
            "subtopic": "Geometry & Mensuration"
        }
    ]
}

FALLBACK_REASONING_POOL = {
    "Easy": [
        {
            "question": "Pointing to a photograph of a boy, Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to that boy?",
            "options": ["Brother", "Uncle", "Father", "Cousin"],
            "correct_index": 2,
            "correct_answer": "Father",
            "explanation": "The only son of Suresh's mother is Suresh himself. Therefore, the boy is Suresh's son, making Suresh the boy's father.",
            "subtopic": "Blood Relations"
        },
        {
            "question": "Find the missing number in the series: 4, 9, 16, 25, 36, ?",
            "options": ["45", "48", "49", "64"],
            "correct_index": 2,
            "correct_answer": "49",
            "explanation": "The series consists of consecutive perfect squares: 2^2, 3^2, 4^2, 5^2, 6^2, 7^2 = 49.",
            "subtopic": "Number Series"
        },
        {
            "question": "If in a certain code, 'APPLE' is coded as 'BQQMF', how is 'MANGO' coded in that code?",
            "options": ["NBOHP", "NBNHP", "OBOIP", "NCOHP"],
            "correct_index": 0,
            "correct_answer": "NBOHP",
            "explanation": "Each letter is shifted forward by +1 position in the alphabet: M(+1)=N, A(+1)=B, N(+1)=O, G(+1)=H, O(+1)=P => NBOHP.",
            "subtopic": "Coding & Decoding"
        },
        {
            "question": "Which word does not belong with the others?",
            "options": ["Guitar", "Violin", "Flute", "Cello"],
            "correct_index": 2,
            "correct_answer": "Flute",
            "explanation": "Guitar, Violin, and Cello are string instruments, whereas Flute is a wind instrument.",
            "subtopic": "Classification & Odd One Out"
        },
        {
            "question": "A man walks 5 km North, then turns right and walks 3 km, then turns right and walks 5 km. In which direction is he now facing?",
            "options": ["North", "South", "East", "West"],
            "correct_index": 1,
            "correct_answer": "South",
            "explanation": "Initial direction North -> Right turn is East -> Another Right turn is South.",
            "subtopic": "Direction Sense"
        }
    ],
    "Moderate": [
        {
            "question": "Statements: All cats are dogs. Some dogs are birds.\nConclusions:\nI. Some cats are birds.\nII. Some birds are dogs.\nWhich conclusion(s) logically follow?",
            "options": ["Only I follows", "Only II follows", "Both I and II follow", "Neither follows"],
            "correct_index": 1,
            "correct_answer": "Only II follows",
            "explanation": "From 'Some dogs are birds', it directly converts to 'Some birds are dogs' (Conclusion II is valid). There is no guaranteed overlap between cats and birds.",
            "subtopic": "Syllogisms"
        },
        {
            "question": "Six friends A, B, C, D, E, and F are sitting in a circle facing the center. B is between A and C. E is between D and F. D is to the immediate left of A. Who is sitting opposite to B?",
            "options": ["D", "E", "F", "C"],
            "correct_index": 1,
            "correct_answer": "E",
            "explanation": "Arrangement in clockwise order: A, B, C, F, E, D. B is directly opposite E.",
            "subtopic": "Seating Arrangements"
        },
        {
            "question": "If '+' means multiply, '-' means divide, '*' means add, and '/' means subtract, what is the value of: 20 * 8 - 4 + 2 / 5 ?",
            "options": ["15", "19", "23", "27"],
            "correct_index": 1,
            "correct_answer": "19",
            "explanation": "Substitute symbols: 20 + 8 / 4 * 2 - 5. Apply BODMAS: 20 + (2 * 2) - 5 = 20 + 4 - 5 = 19.",
            "subtopic": "Mathematical Operations"
        },
        {
            "question": "Find the odd pattern out from the following pairs:",
            "options": ["8 - 64", "6 - 36", "7 - 49", "9 - 72"],
            "correct_index": 3,
            "correct_answer": "9 - 72",
            "explanation": "All other pairs follow the rule (n - n^2): 8^2=64, 6^2=36, 7^2=49. But 9^2 = 81, not 72.",
            "subtopic": "Pattern Recognition"
        },
        {
            "question": "In a queue of 35 people, Rohan is 12th from the front and Priya is 18th from the back. How many people are sitting between Rohan and Priya?",
            "options": ["4", "5", "6", "7"],
            "correct_index": 1,
            "correct_answer": "5",
            "explanation": "Rohan's position from front = 12. Priya's position from front = 35 - 18 + 1 = 18. People between them = 18 - 12 - 1 = 5.",
            "subtopic": "Ranking & Order"
        }
    ],
    "Hard": [
        {
            "question": "Five executives P, Q, R, S, T hold meetings on Monday to Friday. P's meeting is not on Monday or Friday. Q's meeting is immediately after R's. S's meeting is after T's. If R meets on Tuesday, when is S's meeting scheduled?",
            "options": ["Wednesday", "Thursday", "Friday", "Cannot be determined"],
            "correct_index": 2,
            "correct_answer": "Friday",
            "explanation": "Days: Mon, Tue, Wed, Thu, Fri. R meets on Tue => Q meets on Wed (immediately after R). P cannot meet on Mon or Fri => P must meet on Thu. Remaining: Mon and Fri. S is after T => T meets on Mon, S meets on Fri.",
            "subtopic": "Complex Puzzle & Scheduling"
        },
        {
            "question": "Statement: 'The government has decided to offer tax incentives to companies setting up manufacturing hubs in rural areas.'\nAssumptions:\nI. Companies will be willing to move to rural areas if financial incentives are provided.\nII. Rural areas have the basic necessary workforce and infrastructure for manufacturing.\nWhich assumption(s) are implicit?",
            "options": ["Only I is implicit", "Only II is implicit", "Both I and II are implicit", "Neither is implicit"],
            "correct_index": 2,
            "correct_answer": "Both I and II are implicit",
            "explanation": "Offering incentives assumes companies will respond positively (I is implicit) and that feasible operations in rural areas are viable (II is implicit).",
            "subtopic": "Critical Reasoning & Assumptions"
        },
        {
            "question": "In a certain code language:\n'pit na som' means 'bring me water'\n'na jo tod' means 'water is life'\n'tub jo pit' means 'give me life'\nWhat is the code for 'is'?",
            "options": ["pit", "na", "jo", "tod"],
            "correct_index": 3,
            "correct_answer": "tod",
            "explanation": "Comparing 'bring me water' and 'water is life': common word 'water', common code 'na' => water = na. Comparing 'water is life' and 'give me life': common word 'life', common code 'jo' => life = jo. In 'water is life' (na jo tod), remaining word 'is' must be 'tod'.",
            "subtopic": "Cryptic Logic & Matrix Decoding"
        },
        {
            "question": "A clock is set right at 5 a.m. The clock gains 20 minutes in 24 hours. When the clock indicates 7 p.m. on the 4th day, what is the true time?",
            "options": ["5:00 p.m.", "5:30 p.m.", "6:00 p.m.", "6:30 p.m."],
            "correct_index": 2,
            "correct_answer": "6:00 p.m.",
            "explanation": "From 5 a.m. on 1st day to 7 p.m. on 4th day = 3 days (72 hrs) + 14 hrs = 86 hours. Clock rate: 24 hrs 20 min (73/3 hrs) of this clock = 24 hrs of true clock. 86 hrs of this clock = 86 * (72 / 73) true hours = 85 true hours. 85 hrs from 5 a.m. 1st day = 6 p.m. on 4th day.",
            "subtopic": "Clock Mechanics & Anomaly"
        }
    ]
}


def _get_random_fallback_questions() -> List[Dict[str, Any]]:
    """Builds a randomized 20-question set from the fallback pool with exact 3/4/3 difficulty distributions."""
    questions = []
    
    # 1. Aptitude (10 Questions: 3 Easy, 4 Moderate, 3 Hard)
    apti_easy = random.sample(FALLBACK_APTITUDE_POOL["Easy"], min(3, len(FALLBACK_APTITUDE_POOL["Easy"])))
    apti_mod = random.sample(FALLBACK_APTITUDE_POOL["Moderate"], min(4, len(FALLBACK_APTITUDE_POOL["Moderate"])))
    apti_hard = random.sample(FALLBACK_APTITUDE_POOL["Hard"], min(3, len(FALLBACK_APTITUDE_POOL["Hard"])))
    
    aptitude_items = apti_easy + apti_mod + apti_hard
    for q in aptitude_items:
        q_copy = dict(q)
        q_copy["type"] = "aptitude"
        q_copy["category"] = "Quantitative Aptitude"
        if q in apti_easy:
            q_copy["difficulty"] = "Easy"
        elif q in apti_mod:
            q_copy["difficulty"] = "Moderate"
        else:
            q_copy["difficulty"] = "Hard"
        questions.append(q_copy)
        
    # 2. Reasoning (10 Questions: 3 Easy, 4 Moderate, 3 Hard)
    reas_easy = random.sample(FALLBACK_REASONING_POOL["Easy"], min(3, len(FALLBACK_REASONING_POOL["Easy"])))
    reas_mod = random.sample(FALLBACK_REASONING_POOL["Moderate"], min(4, len(FALLBACK_REASONING_POOL["Moderate"])))
    reas_hard = random.sample(FALLBACK_REASONING_POOL["Hard"], min(3, len(FALLBACK_REASONING_POOL["Hard"])))
    
    reasoning_items = reas_easy + reas_mod + reas_hard
    for q in reasoning_items:
        q_copy = dict(q)
        q_copy["type"] = "reasoning"
        q_copy["category"] = "Logical Reasoning"
        if q in reas_easy:
            q_copy["difficulty"] = "Easy"
        elif q in reas_mod:
            q_copy["difficulty"] = "Moderate"
        else:
            q_copy["difficulty"] = "Hard"
        questions.append(q_copy)

    # Assign IDs 1 through 20
    for idx, item in enumerate(questions, start=1):
        item["id"] = idx

    return questions


def generate_aptitude_reasoning_questions(
    api_key: Optional[str] = None,
    target_role: Optional[str] = None,
    candidate_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates 20 unique Aptitude & Reasoning MCQ questions via LLM.
    Strictly follows:
      - 10 Aptitude Questions: 3 Easy, 4 Moderate, 3 Hard
      - 10 Reasoning Questions: 3 Easy, 4 Moderate, 3 Hard
    Each question provides 4 distinct options, correct index, and step-by-step explanation.
    """
    # If no usable key is available, skip the LLM entirely and serve the curated bank.
    if not (api_key or os.getenv("GROQ_API_KEY", "").strip()):
        fallback = _get_random_fallback_questions()
        return {"status": "success", "total_questions": len(fallback), "questions": fallback}

    try:
        client = get_openai_client(api_key)
    except Exception as e:
        print(f"LLM client unavailable ({e}); using fallback assessment pool.")
        fallback = _get_random_fallback_questions()
        return {"status": "success", "total_questions": len(fallback), "questions": fallback}

    role_ctx = f"Target Role: {target_role}" if target_role else "Target Role: General Professional & Engineering"
    timestamp_seed = int(time.time() * 1000) % 100000

    prompt = f"""You are an expert psychometric and technical assessment designer.
Generate an aptitude and logical reasoning assessment consisting of EXACTLY 20 Multiple Choice Questions (MCQs) for an employment interview.
{role_ctx}
Random Session Seed: {timestamp_seed}

STRICT QUESTION DISTRIBUTION REQUIREMENTS:
1. First 10 Questions (IDs 1-10) MUST BE QUANTITATIVE APTITUDE:
   - Exactly 3 Easy difficulty questions (IDs 1, 2, 3)
   - Exactly 4 Moderate difficulty questions (IDs 4, 5, 6, 7)
   - Exactly 3 Hard difficulty questions (IDs 8, 9, 10)
   Topics to include across aptitude: Percentages, Ratios, Speed-Distance, Time-Work, Profit-Loss, Mixtures, Probability, Permutations, Simple/Compound Interest, Averages.

2. Next 10 Questions (IDs 11-20) MUST BE LOGICAL REASONING:
   - Exactly 3 Easy difficulty questions (IDs 11, 12, 13)
   - Exactly 4 Moderate difficulty questions (IDs 14, 15, 16, 17)
   - Exactly 3 Hard difficulty questions (IDs 18, 19, 20)
   Topics to include across reasoning: Blood Relations, Number & Letter Series, Syllogisms, Coding-Decoding, Seating Arrangement, Direction Sense, Critical Logic, Analogies, Clocks & Calendars.

RULES FOR EACH QUESTION:
- Must have EXACTLY 4 clear, plausible options (A, B, C, D) in the 'options' array.
- 'correct_index' must be an integer from 0 to 3 matching the correct option in 'options'.
- 'correct_answer' must be the exact string of the correct option.
- 'explanation' must provide a clear step-by-step mathematical or logical solution.
- Make all questions unique and distinct for this session.

Return ONLY valid JSON following this exact structure:
{{
  "questions": [
    {{
      "id": 1,
      "type": "aptitude",
      "category": "Quantitative Aptitude",
      "subtopic": "Percentages",
      "difficulty": "Easy",
      "question": "Question 1 text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "correct_answer": "Option A",
      "explanation": "Step-by-step reasoning here."
    }},
    {{
      "id": 2,
      "type": "aptitude",
      "category": "Quantitative Aptitude",
      "subtopic": "Ratios",
      "difficulty": "Easy",
      "question": "Question 2 text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 1,
      "correct_answer": "Option B",
      "explanation": "Step-by-step reasoning here."
    }}
  ]
}}
"""

    try:
        response = client.chat.completions.create(
            model=os.getenv("APTITUDE_GROQ_MODEL", "openai/gpt-oss-120b"),
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional assessment generator. Output ONLY a single valid JSON object containing the complete array of all 20 questions in 'questions'. No preamble, no markdown wraps."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        data = json.loads(content)
        questions = data.get("questions", [])

        # Validate structure: ensure exactly 20 questions with correct fields
        if len(questions) == 20:
            for idx, q in enumerate(questions, start=1):
                q["id"] = idx
                if idx <= 10:
                    q["type"] = "aptitude"
                    q["category"] = "Quantitative Aptitude"
                    if idx <= 3:
                        q["difficulty"] = "Easy"
                    elif idx <= 7:
                        q["difficulty"] = "Moderate"
                    else:
                        q["difficulty"] = "Hard"
                else:
                    q["type"] = "reasoning"
                    q["category"] = "Logical Reasoning"
                    if idx <= 13:
                        q["difficulty"] = "Easy"
                    elif idx <= 17:
                        q["difficulty"] = "Moderate"
                    else:
                        q["difficulty"] = "Hard"

                # Ensure 4 options and valid correct_index
                if "options" not in q or len(q["options"]) < 4:
                    raise ValueError("Question missing 4 options")
                q["options"] = q["options"][:4]
                if "correct_index" not in q or not (0 <= q["correct_index"] <= 3):
                    q["correct_index"] = 0
                q["correct_answer"] = q["options"][q["correct_index"]]
                if "explanation" not in q:
                    q["explanation"] = f"Correct answer is {q['correct_answer']}."

            return {
                "status": "success",
                "total_questions": len(questions),
                "questions": questions
            }
        else:
            print(f"Warning: LLM returned {len(questions)} questions instead of 20. Merging with fallback pool.")
            fallback = _get_random_fallback_questions()
            return {
                "status": "success",
                "total_questions": len(fallback),
                "questions": fallback
            }

    except Exception as e:
        print(f"Error generating LLM assessment questions: {e}. Utilizing fallback assessment pool.")
        fallback = _get_random_fallback_questions()
        return {
            "status": "success",
            "total_questions": len(fallback),
            "questions": fallback
        }


def evaluate_aptitude_reasoning(
    user_answers: Dict[str, Any],
    questions: List[Dict[str, Any]],
    time_taken_seconds: int = 0
) -> Dict[str, Any]:
    """
    Evaluates candidate submission for the 20-question Aptitude & Reasoning test.
    Computes:
      - Total Score ($/20$) and Percentage ($%$)
      - Category breakdown: Aptitude ($/10$) and Reasoning ($/10$)
      - Difficulty breakdown:
          - Aptitude: Easy ($/3$), Moderate ($/4$), Hard ($/3$)
          - Reasoning: Easy ($/3$), Moderate ($/4$), Hard ($/3$)
      - Question-by-question review items with candidate's choice, correct choice, is_correct flag, and solution.
    """
    total_questions = len(questions)
    correct_count = 0
    
    aptitude_stats = {"total": 0, "correct": 0, "easy_total": 0, "easy_correct": 0, "mod_total": 0, "mod_correct": 0, "hard_total": 0, "hard_correct": 0}
    reasoning_stats = {"total": 0, "correct": 0, "easy_total": 0, "easy_correct": 0, "mod_total": 0, "mod_correct": 0, "hard_total": 0, "hard_correct": 0}
    
    detailed_review = []
    
    for q in questions:
        q_id = str(q.get("id"))
        q_type = q.get("type", "aptitude")
        difficulty = q.get("difficulty", "Moderate")
        correct_idx = q.get("correct_index", 0)
        options = q.get("options", [])
        correct_text = q.get("correct_answer", options[correct_idx] if options and len(options) > correct_idx else "")
        
        # Candidate's answer can be passed as option index or option string.
        # Note: a valid selection can be option index 0 (falsy), so check for
        # key presence explicitly rather than relying on truthiness.
        if q_id in user_answers:
            user_ans_val = user_answers[q_id]
        elif q_id.isdigit() and int(q_id) in user_answers:
            user_ans_val = user_answers[int(q_id)]
        else:
            user_ans_val = None
        user_selected_idx = None
        user_selected_text = "Not Attempted"
        
        if user_ans_val is not None:
            if isinstance(user_ans_val, int) and 0 <= user_ans_val < len(options):
                user_selected_idx = user_ans_val
                user_selected_text = options[user_selected_idx]
            elif isinstance(user_ans_val, str):
                if user_ans_val.isdigit() and int(user_ans_val) < len(options):
                    user_selected_idx = int(user_ans_val)
                    user_selected_text = options[user_selected_idx]
                else:
                    user_selected_text = user_ans_val
                    if user_ans_val in options:
                        user_selected_idx = options.index(user_ans_val)
                        
        is_correct = (user_selected_idx is not None and user_selected_idx == correct_idx) or (
            user_selected_text != "Not Attempted" and user_selected_text.strip().lower() == correct_text.strip().lower()
        )
        
        if is_correct:
            correct_count += 1

        # Track Category and Difficulty stats
        stats_target = aptitude_stats if q_type == "aptitude" else reasoning_stats
        stats_target["total"] += 1
        if is_correct:
            stats_target["correct"] += 1
            
        if difficulty == "Easy":
            stats_target["easy_total"] += 1
            if is_correct: stats_target["easy_correct"] += 1
        elif difficulty == "Moderate":
            stats_target["mod_total"] += 1
            if is_correct: stats_target["mod_correct"] += 1
        elif difficulty == "Hard":
            stats_target["hard_total"] += 1
            if is_correct: stats_target["hard_correct"] += 1

        detailed_review.append({
            "id": q.get("id"),
            "question": q.get("question"),
            "category": q.get("category"),
            "subtopic": q.get("subtopic", "General"),
            "difficulty": difficulty,
            "options": options,
            "user_selected_index": user_selected_idx,
            "user_selected_answer": user_selected_text,
            "correct_index": correct_idx,
            "correct_answer": correct_text,
            "is_correct": is_correct,
            "explanation": q.get("explanation", "")
        })

    overall_percentage = round((correct_count / max(1, total_questions)) * 100, 1)
    apti_percentage = round((aptitude_stats["correct"] / max(1, aptitude_stats["total"])) * 100, 1) if aptitude_stats["total"] > 0 else 0
    reas_percentage = round((reasoning_stats["correct"] / max(1, reasoning_stats["total"])) * 100, 1) if reasoning_stats["total"] > 0 else 0
    
    # Generate assessment verdict & feedback
    if overall_percentage >= 80:
        verdict = "Excellent Assessment Mastery"
        summary = "Candidate demonstrates superior analytical speed, high quantitative precision, and exceptional logical problem-solving aptitude."
    elif overall_percentage >= 60:
        verdict = "Good Competency"
        summary = "Candidate exhibits reliable foundational aptitude and logical clarity, with minor opportunities for speed optimization in hard-tier problems."
    elif overall_percentage >= 40:
        verdict = "Average Performance"
        summary = "Candidate shows acceptable grasp of basic concepts but struggled with moderate and hard mathematical calculations and multi-step reasoning."
    else:
        verdict = "Needs Improvement"
        summary = "Candidate scored below baseline in quantitative and analytical reasoning. Focus on foundational math shortcuts and structured logical deductions is recommended."

    return {
        "total_questions": total_questions,
        "correct_answers": correct_count,
        "score_percentage": overall_percentage,
        "verdict": verdict,
        "summary": summary,
        "time_taken_seconds": time_taken_seconds,
        "aptitude": {
            "total": aptitude_stats["total"],
            "correct": aptitude_stats["correct"],
            "percentage": apti_percentage,
            "difficulty_breakdown": {
                "easy": f"{aptitude_stats['easy_correct']}/{aptitude_stats['easy_total']}",
                "moderate": f"{aptitude_stats['mod_correct']}/{aptitude_stats['mod_total']}",
                "hard": f"{aptitude_stats['hard_correct']}/{aptitude_stats['hard_total']}"
            }
        },
        "reasoning": {
            "total": reasoning_stats["total"],
            "correct": reasoning_stats["correct"],
            "percentage": reas_percentage,
            "difficulty_breakdown": {
                "easy": f"{reasoning_stats['easy_correct']}/{reasoning_stats['easy_total']}",
                "moderate": f"{reasoning_stats['mod_correct']}/{reasoning_stats['mod_total']}",
                "hard": f"{reasoning_stats['hard_correct']}/{reasoning_stats['hard_total']}"
            }
        },
        "detailed_review": detailed_review
    }
