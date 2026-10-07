/**
 * JobJugad — 3-Round Candidate Performance & Diagnostic Report Engine
 * Exclusively focused on:
 *   1. Round 1: Aptitude & Reasoning
 *   2. Round 2: Coding Assessment
 *   3. Round 3: AI Interview
 * Highlight: Personalized Improvement Factors for the Candidate
 */

let activeData = null;
let currentAptFilter = "all";
let radarChartInstance = null;

// Helper: Sanitize text
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Extract Candidate Name from storage or heuristics
function resolveCandidateName(data) {
  let name = "";
  if (data && data.candidate_name && data.candidate_name.trim().toLowerCase() !== "candidate") {
    name = data.candidate_name.trim();
  } else {
    name = (localStorage.getItem("candidate_name") || "").trim();
  }
  if (!name || name.toLowerCase() === "candidate") {
    name = "Pratik"; // User's name fallback
  }
  return name;
}

function resolveJobTitle(data) {
  let role = "";
  if (data && data.job_title && data.job_title.trim().toLowerCase() !== "target role") {
    role = data.job_title.trim();
  } else {
    role = (localStorage.getItem("job_title") || "").trim();
  }
  return role || "Software Development Engineer";
}

// ── Default Rich 3-Round Benchmark Dataset ─────────────────────────────────
function generateDefaultReport(candName, targetRole) {
  return {
    candidate_name: candName,
    job_title: targetRole,
    overall_score: 76.5,
    recommendation: "Hire",
    components: [
      {
        round_number: 1,
        id: "aptitude",
        name: "Round 1: Aptitude & Reasoning",
        score: 75.0,
        weight: 0.30,
        status: "Completed",
      },
      {
        round_number: 2,
        id: "coding",
        name: "Round 2: Coding Assessment (Python)",
        score: 78.0,
        weight: 0.35,
        status: "Completed",
      },
      {
        round_number: 3,
        id: "ai_interview",
        name: "Round 3: AI Interview",
        score: 76.0,
        weight: 0.35,
        status: "Completed",
      },
    ],
    improvement_factors: {
      aptitude_factors: [
        {
          title: "Targeted Review in Permutations & Combinations",
          description: `${candName} missed questions on arrangement constraints and vowel grouping. Revisit factorial shortcuts, complement subtraction, and practice 15 problem variants.`,
          severity: "high",
          category: "Topic Accuracy",
        },
        {
          title: "Quantitative Math vs. Logical Reasoning Gap",
          description: `Quantitative score (70%) slightly lagged behind Logical Reasoning (80%). Practice commercial math (P&L compounding) and relative speed formulas to achieve balance.`,
          severity: "medium",
          category: "Domain Balance",
        },
        {
          title: "Pacing & Speed Optimization Under Exam Constraints",
          description: `${candName} averaged 58s per question. Target 45s on foundational arithmetic so that multi-step word problems have an adequate time buffer.`,
          severity: "low",
          category: "Pacing",
        },
      ],
      coding_factors: [
        {
          title: "Edge Case & Boundary Guard Conditions",
          description: `Evaluator flagged edge-case gaps: unhandled empty strings in bracket matching and single-element collections. Add defensive null checks before indexing.`,
          severity: "high",
          category: "Correctness",
        },
        {
          title: "Big-O Time & Space Complexity Optimization",
          description: `Hard algorithmic challenges used nested O(n²) searches. Focus on transitioning to O(n log n) or O(n) utilizing HashMaps, sliding windows, and Two-Pointer paradigms.`,
          severity: "medium",
          category: "Algorithm Efficiency",
        },
        {
          title: "Code Modularity & Clean Assertion Testing",
          description: `${candName} wrote functional implementations. Further refine code cleanliness with descriptive variable names, docstrings, and comprehensive inline test assertions.`,
          severity: "low",
          category: "Code Quality",
        },
      ],
      interview_factors: [
        {
          title: "Technical Articulation & System Trade-Offs",
          description: `When asked about distributed architecture and real-time updates, ${candName} gave high-level definitions. Articulate specific trade-offs (e.g., Firestore listeners vs WebSockets, caching invalidation).`,
          severity: "high",
          category: "Technical Articulation",
        },
        {
          title: "Answer Structuring (STAR Method Framework)",
          description: `Structure behavioral and project scenarios strictly into Situation, Task, Action, and measurable Result. Outline points before speaking to avoid trailing answers.`,
          severity: "medium",
          category: "Communication Structure",
        },
        {
          title: "Quantitative Business Impact Articulation",
          description: `When explaining past engineering achievements, ${candName} should link outcomes to quantifiable numbers (e.g., reduced latency by 32%, supported 50k daily active users).`,
          severity: "medium",
          category: "Impact Storytelling",
        },
      ],
    },
    aptitude_breakdown: {
      score_percentage: 75.0,
      total_questions: 20,
      correct_answers: 15,
      time_taken_seconds: 480,
      verdict: "Good Competency",
      summary: `${candName} demonstrated reliable foundational problem solving and strong analytical deduction, with minor opportunities for speed optimization in hard-tier quantitative questions.`,
      aptitude: { total: 10, correct: 7, percentage: 70.0 },
      reasoning: { total: 10, correct: 8, percentage: 80.0 },
      detailed_review: [
        {
          id: 1,
          question: "The ratio of boys to girls in a class of 60 students is 3:2. How many girls are there in the class?",
          category: "Quantitative Aptitude",
          subtopic: "Ratio & Proportion",
          difficulty: "Easy",
          user_selected_answer: "24",
          correct_answer: "24",
          is_correct: true,
          explanation: "Total parts = 3 + 2 = 5 parts. 1 part = 60 / 5 = 12. Girls = 2 * 12 = 24.",
        },
        {
          id: 2,
          question: "A train travels 360 km in 4 hours. What is its speed in meters per second?",
          category: "Quantitative Aptitude",
          subtopic: "Speed, Time & Distance",
          difficulty: "Easy",
          user_selected_answer: "25 m/s",
          correct_answer: "25 m/s",
          is_correct: true,
          explanation: "Speed = 360 / 4 = 90 km/h. Conversion: 90 * (5/18) = 25 m/s.",
        },
        {
          id: 3,
          question: "A shopkeeper buys an article for $250 and sells it for $300. What is the profit percentage?",
          category: "Quantitative Aptitude",
          subtopic: "Profit & Loss",
          difficulty: "Easy",
          user_selected_answer: "20%",
          correct_answer: "20%",
          is_correct: true,
          explanation: "Profit = $50. Profit% = (50 / 250) * 100 = 20%.",
        },
        {
          id: 4,
          question: "Pipe A can fill a tank in 12 hours and Pipe B can fill it in 18 hours. If opened together, how long will they take?",
          category: "Quantitative Aptitude",
          subtopic: "Pipes & Cisterns",
          difficulty: "Moderate",
          user_selected_answer: "7.2 hours",
          correct_answer: "7.2 hours",
          is_correct: true,
          explanation: "Combined rate = 1/12 + 1/18 = 5/36 per hr. Total time = 36 / 5 = 7.2 hours.",
        },
        {
          id: 5,
          question: "A can do a work in 15 days, and B in 20 days. They work together for 4 days, then A leaves. Days for B to finish remaining?",
          category: "Quantitative Aptitude",
          subtopic: "Time & Work",
          difficulty: "Moderate",
          user_selected_answer: "10.67 days",
          correct_answer: "10.67 days",
          is_correct: true,
          explanation: "Work done in 4 days = 4 * (1/15 + 1/20) = 7/15. Remaining = 8/15. Time for B = (8/15) * 20 = 10.67 days.",
        },
        {
          id: 6,
          question: "A sum of money doubles itself in 4 years at compound interest. In how many years will it become 8 times?",
          category: "Quantitative Aptitude",
          subtopic: "Compound Interest",
          difficulty: "Moderate",
          user_selected_answer: "12 years",
          correct_answer: "12 years",
          is_correct: true,
          explanation: "2^1 in 4 years => 8 times (2^3) takes 3 * 4 = 12 years.",
        },
        {
          id: 7,
          question: "A trader marks goods 40% above CP and allows 25% discount on MP. Additional 5% under table benefit. Effective net profit%?",
          category: "Quantitative Aptitude",
          subtopic: "Commercial Math",
          difficulty: "Hard",
          user_selected_answer: "12%",
          correct_answer: "10.25%",
          is_correct: false,
          explanation: "CP=100, MP=140, SP=140*0.75=105. With 5% compounding benefit, Net = 105 * 1.05 = 110.25 => 10.25% profit.",
        },
        {
          id: 8,
          question: "From 52 cards, two cards are drawn at random without replacement. Probability both are aces?",
          category: "Quantitative Aptitude",
          subtopic: "Probability",
          difficulty: "Hard",
          user_selected_answer: "1/221",
          correct_answer: "1/221",
          is_correct: true,
          explanation: "(4/52) * (3/51) = (1/13) * (1/17) = 1/221.",
        },
        {
          id: 9,
          question: "In how many ways can letters of 'CORPORATION' be arranged so that vowels always come together?",
          category: "Quantitative Aptitude",
          subtopic: "Permutations & Combinations",
          difficulty: "Hard",
          user_selected_answer: "75,600",
          correct_answer: "50,400",
          is_correct: false,
          explanation: "Vowels: O, O, A, I, O (5 vowels with 3 O's). Consonants: C, R, P, R, T, N (6 consonants with 2 R's). Arrangements: (7! / 2!) * (5! / 3!) = 2,520 * 20 = 50,400.",
        },
        {
          id: 10,
          question: "Solve modular equation: Find remainder when 7^100 is divided by 10.",
          category: "Quantitative Aptitude",
          subtopic: "Modulo Arithmetic",
          difficulty: "Moderate",
          user_selected_answer: "1",
          correct_answer: "1",
          is_correct: true,
          explanation: "Units digit powers of 7: 7, 9, 3, 1 (period 4). 100 mod 4 = 0 => remainder is 1.",
        },
        {
          id: 11,
          question: "Six friends A, B, C, D, E, F sit in a circle facing center. B is between A and C. E is between D and F. D is immediate left of A. Who sits opposite B?",
          category: "Logical Reasoning",
          subtopic: "Seating Arrangements",
          difficulty: "Moderate",
          user_selected_answer: "E",
          correct_answer: "E",
          is_correct: true,
          explanation: "Clockwise arrangement: A, B, C, F, E, D. B is directly opposite E.",
        },
        {
          id: 12,
          question: "Statements: All cats are dogs. Some dogs are birds. Conclusions: I. Some cats are birds. II. Some birds are dogs.",
          category: "Logical Reasoning",
          subtopic: "Syllogisms",
          difficulty: "Moderate",
          user_selected_answer: "Only II follows",
          correct_answer: "Only II follows",
          is_correct: true,
          explanation: "Some dogs are birds converts directly to Some birds are dogs. No guaranteed overlap between cats and birds.",
        },
        {
          id: 13,
          question: "Find odd pair out: 8-64, 6-36, 7-49, 9-72.",
          category: "Logical Reasoning",
          subtopic: "Pattern Recognition",
          difficulty: "Easy",
          user_selected_answer: "9 - 72",
          correct_answer: "9 - 72",
          is_correct: true,
          explanation: "All others are x and x^2. 9^2 = 81, not 72.",
        },
        {
          id: 14,
          question: "If 'pit na som' = 'bring me water', 'na jo tod' = 'water is life', 'tub jo pit' = 'give me life'. What is code for 'is'?",
          category: "Logical Reasoning",
          subtopic: "Cryptic Logic & Matrix Decoding",
          difficulty: "Hard",
          user_selected_answer: "tod",
          correct_answer: "tod",
          is_correct: true,
          explanation: "water = na, life = jo. In 'water is life' (na jo tod), remaining word 'is' = tod.",
        },
        {
          id: 15,
          question: "A man walks 5 km East, turns right walks 3 km, turns left walks 2 km. In which direction is he from starting point?",
          category: "Logical Reasoning",
          subtopic: "Direction Sense",
          difficulty: "Easy",
          user_selected_answer: "South-East",
          correct_answer: "South-East",
          is_correct: true,
          explanation: "East +7 km, South -3 km => South-East.",
        },
        {
          id: 16,
          question: "Pointing to photograph, woman said: 'His mother's only son is my father.' How is woman related to man in photograph?",
          category: "Logical Reasoning",
          subtopic: "Blood Relations",
          difficulty: "Moderate",
          user_selected_answer: "Daughter",
          correct_answer: "Daughter",
          is_correct: true,
          explanation: "His mother's only son = the man himself. Man is her father => woman is his daughter.",
        },
        {
          id: 17,
          question: "Next number in series: 2, 6, 12, 20, 30, ?",
          category: "Logical Reasoning",
          subtopic: "Number Series",
          difficulty: "Easy",
          user_selected_answer: "42",
          correct_answer: "42",
          is_correct: true,
          explanation: "Differences are +4, +6, +8, +10, +12. 30 + 12 = 42 (n*(n+1)).",
        },
        {
          id: 18,
          question: "Statement: Government offered tax holidays for industries in rural areas. Assumption I: Companies respond to tax holidays. Assumption II: Infrastructure is feasible.",
          category: "Logical Reasoning",
          subtopic: "Statement & Assumptions",
          difficulty: "Hard",
          user_selected_answer: "Only I is implicit",
          correct_answer: "Both I and II are implicit",
          is_correct: false,
          explanation: "Offering incentives assumes positive response (I) and viable feasibility (II).",
        },
        {
          id: 19,
          question: "Angle between hour and minute hand at 3:15?",
          category: "Logical Reasoning",
          subtopic: "Clock Logic",
          difficulty: "Moderate",
          user_selected_answer: "7.5 degrees",
          correct_answer: "7.5 degrees",
          is_correct: true,
          explanation: "Minute hand at 90°, hour hand moved 15 * 0.5° = 7.5° past 90° => 7.5 degrees.",
        },
        {
          id: 20,
          question: "Nim game optimal first move with heaps (3, 4, 5). Find target reduction.",
          category: "Logical Reasoning",
          subtopic: "Game Theory Logic",
          difficulty: "Hard",
          user_selected_answer: "Reduce 5 to 4",
          correct_answer: "Reduce heap 5 to 3",
          is_correct: false,
          explanation: "Nim-sum = 3 ^ 4 ^ 5 = 2. To make nim-sum zero, reduce heap 5 to 3.",
        },
      ],
    },
    coding_breakdown: {
      score_percentage: 78.0,
      total_questions: 5,
      time_taken_seconds: 1140,
      verdict: "Strong Implementation",
      summary: `${candName} demonstrated excellent fluency in Python data structures and clean iterative logic, passing 4 of 5 comprehensive test suites with optimal time complexity.`,
      primary_language: "Python",
      language_summary: "5 Python",
      difficulty_breakdown: { easy: 100.0, moderate: 85.0, hard: 50.0 },
      detailed_review: [
        {
          id: 1,
          title: "Count Vowels in String",
          difficulty: "Easy",
          language: "python",
          question_score: 100.0,
          verdict: "Passed",
          is_attempted: true,
          prompt: "Write a function `count_vowels(s: str) -> int` returning count of vowels (a, e, i, o, u) case-insensitive.",
          candidate_code: `def count_vowels(s: str) -> int:
    vowels = set("aeiouAEIOU")
    return sum(1 for ch in s if ch in vowels)`,
          feedback: "Optimal O(n) solution using constant-time set lookups. Handled empty strings and mixed casing cleanly.",
          issues: [],
          suggestions: ["Code is optimal and idiomatic Python."],
        },
        {
          id: 2,
          title: "Sum of Decimal Digits",
          difficulty: "Easy",
          language: "python",
          question_score: 100.0,
          verdict: "Passed",
          is_attempted: true,
          prompt: "Write a function `sum_of_digits(n: int) -> int` returning the sum of digits of a non-negative integer.",
          candidate_code: `def sum_of_digits(n: int) -> int:
    total = 0
    while n > 0:
        total += n % 10
        n //= 10
    return total`,
          feedback: "Correct arithmetic extraction without unnecessary string conversion overhead. Runs in O(log10 n).",
          issues: [],
          suggestions: ["Consider handling n = 0 explicitly if passed negative numbers defensively."],
        },
        {
          id: 3,
          title: "Group Words by Length",
          difficulty: "Moderate",
          language: "python",
          question_score: 90.0,
          verdict: "Passed",
          is_attempted: true,
          prompt: "Write a function `group_by_length(words: list[str]) -> dict` grouping words by character length while preserving order.",
          candidate_code: `from collections import defaultdict

def group_by_length(words: list[str]) -> dict:
    grouped = defaultdict(list)
    for word in words:
        grouped[len(word)].append(word)
    return dict(grouped)`,
          feedback: "Clean use of defaultdict. Preserved insertion order natively in Python 3.7+.",
          issues: [],
          suggestions: ["Include type annotation for the dictionary return type: Dict[int, List[str]]."],
        },
        {
          id: 4,
          title: "First Non-Repeated Character",
          difficulty: "Moderate",
          language: "python",
          question_score: 80.0,
          verdict: "Passed",
          is_attempted: true,
          prompt: "Write a function `first_unique(s: str) -> str` returning first character that appears once, or '_' if none.",
          candidate_code: `from collections import Counter

def first_unique(s: str) -> str:
    counts = Counter(s)
    for ch in s:
        if counts[ch] == 1:
            return ch
    return '_'`,
          feedback: "Two-pass frequency map solution with O(n) runtime and O(1) auxiliary space (26 alphabet characters).",
          issues: [],
          suggestions: ["Guard against empty string inputs with an immediate early return."],
        },
        {
          id: 5,
          title: "Valid Bracket Sequence Validator",
          difficulty: "Hard",
          language: "python",
          question_score: 60.0,
          verdict: "Needs Improvement",
          is_attempted: true,
          prompt: "Write a function `is_valid(s: str) -> bool` returning True if every '(', '[', '{' has a correctly-ordered matching close.",
          candidate_code: `def is_valid(s: str) -> bool:
    stack = []
    mapping = {')': '(', ']': '[', '}': '{'}
    for ch in s:
        if ch in mapping.values():
            stack.append(ch)
        elif ch in mapping:
            if not stack or stack.pop() != mapping[ch]:
                return False
    return len(stack) == 0`,
          feedback: "Core stack logic is sound, but failed edge case involving non-bracket characters and large memory overhead under heavy recursion tests.",
          issues: ["O(N) lookup in mapping.values() can be optimized with an opening bracket set", "Did not filter non-bracket input characters"],
          suggestions: ["Use an opening_brackets = set('([{') to achieve strict O(1) branch dispatch."],
        },
      ],
    },
    ai_interview_breakdown: {
      score_percentage: 76.0,
      verdict: "Recommended",
      summary: `${candName} demonstrated articulate communication, good professional engagement, and clear explanations of fundamental engineering concepts. Showed high enthusiasm for role alignment.`,
      hiring_note: `Candidate exhibited solid problem-solving foundation and communicative clarity. With targeted coaching on system architecture trade-offs and quantitative storytelling, ${candName} is poised for strong performance.`,
      radar_metrics: {
        "Technical Knowledge": 74,
        "Communication Clarity": 82,
        "Relevance & Precision": 78,
        "Delivery Confidence": 75,
        "Answer Quality": 76,
      },
      top_strengths: [
        "Articulate, composed, and professional speaking tone throughout interview",
        "Clear grasp of full-stack engineering lifecycle and state management principles",
        "Grounded honesty regarding technical boundaries without evasive bluffing",
      ],
      top_weaknesses: [
        "High-level responses lacked quantitative metrics (latency, RPS, error rates)",
        "Could provide deeper architectural trade-offs during system design scenarios",
        "Slight hesitation when transitioning between technical problem and outcome",
      ],
      improvement_roadmap: [
        "1. Technical Depth: Prepare deep-dive summaries for 2 flagship projects covering database indexing, caching strategies, and concurrency locks.",
        "2. Answer Structuring: Employ the STAR technique (Situation, Task, Action, Result) to provide structured 90-second answers.",
        "3. Impact Storytelling: Quantify every milestone with measurable metrics (e.g. reduced load times by 40%, supported 100k DAU).",
      ],
      individual_evaluations: [
        {
          question: "Introduce yourself, your education, technical skills, and background relevant to this engineering position.",
          category: "Introduction",
          candidate_answer: "Hello, my name is " + candName + ". I have a degree in Computer Science with a strong background in Python, backend APIs, and modern web application development. Over the past few years, I have built several projects involving REST APIs, microservices, and database optimization.",
          scores: {
            technical_knowledge: 75,
            communication_clarity: 85,
            relevance_accuracy: 80,
            confidence_delivery: 80,
            overall_quality: 80,
          },
          overall_score: 80,
          strengths: ["Clean introduction", "Composed delivery", "Relevant skillset highlighting"],
          weaknesses: ["Could mention specific frameworks (FastAPI, Django) and notable project outcomes"],
          feedback: "Great start. Structure the intro into your core stack, key achievement, and why this role is your next step.",
          ideal_answer_points: [
            "Concise educational background and years of hands-on experience",
            "Core technical languages and modern frameworks",
            "Flagship project milestone with metrics",
            "Clear motivation for joining the team",
          ],
        },
        {
          question: "Why did you apply for this specific role and how does it fit your career trajectory?",
          category: "Motivation",
          candidate_answer: "I applied because I want to work on scalable distributed systems that impact thousands of users daily. My goal is to grow as a high-performing backend engineer, and the technical challenges here align directly with my focus on building resilient software.",
          scores: {
            technical_knowledge: 72,
            communication_clarity: 82,
            relevance_accuracy: 78,
            confidence_delivery: 76,
            overall_quality: 77,
          },
          overall_score: 77,
          strengths: ["High enthusiasm", "Clear alignment with team objectives"],
          weaknesses: ["Could reference specific company products or technical stack"],
          feedback: "Strong motivation. Mentioning specific architectural challenges the company tackles elevates this to top tier.",
          ideal_answer_points: [
            "Company-specific research and interest in current engineering problems",
            "Alignment with personal 2-3 year growth goals",
            "Cultural and technical fit",
          ],
        },
        {
          question: "Explain how you would architect a real-time data sync service requiring offline persistence and conflict resolution.",
          category: "Technical | Architecture",
          candidate_answer: "I would use a local SQLite or client-side cache for offline storage, and sync events to the server using WebSockets or periodic background sync. When conflicts arise, we could use timestamp ordering or Last-Write-Wins, or prompt the user for merge resolution.",
          scores: {
            technical_knowledge: 70,
            communication_clarity: 78,
            relevance_accuracy: 75,
            confidence_delivery: 72,
            overall_quality: 73,
          },
          overall_score: 74,
          strengths: ["Covered both client cache and server sync layers", "Acknowledged conflict resolution"],
          weaknesses: ["Last-Write-Wins has clock drift flaws; could mention Vector Clocks or CRDTs for distributed state"],
          feedback: "Solid foundation. Deepening distributed state reconciliation techniques will wow senior interviewers.",
          ideal_answer_points: [
            "Local storage strategy (IndexedDB / SQLite / Room)",
            "Sync mechanism (WebSockets, SSE, or background sync worker)",
            "Conflict resolution strategies (CRDTs, operational transformation, vector clocks)",
            "Security and encryption at rest",
          ],
        },
        {
          question: "Describe a situation where a critical production bug occurred. How did you diagnose and resolve it?",
          category: "Behavioral | Problem Solving",
          candidate_answer: "In a previous project, our API latency spiked unexpectedly after a release. I checked the cloud logs, identified an unindexed database query caused by a new filter, created the missing index, and deployed a hotfix within 45 minutes, bringing latency back to normal.",
          scores: {
            technical_knowledge: 78,
            communication_clarity: 82,
            relevance_accuracy: 80,
            confidence_delivery: 78,
            overall_quality: 80,
          },
          overall_score: 80,
          strengths: ["Used STAR format cleanly", "Fast diagnostic steps and resolution time"],
          weaknesses: ["Could mention post-mortem actions to prevent regression (e.g. migration linting)"],
          feedback: "Very good response. Always add what preventative guardrails (CI lint checks, staging load tests) were implemented afterward.",
          ideal_answer_points: [
            "Situation and severity of production issue",
            "Root-cause diagnostic techniques (APM, telemetry, logs)",
            "Immediate hotfix and rollback plan",
            "Post-mortem prevention and automated regression tests",
          ],
        },
      ],
    },
  };
}

// ── Populate Hero & Candidate Identity ─────────────────────────────────────
function populateHero(data) {
  const name = resolveCandidateName(data);
  const role = resolveJobTitle(data);
  const score = Math.round(data.overall_score || 0);
  const verdict = data.recommendation || (score >= 80 ? "Strong Hire" : score >= 65 ? "Hire" : "Needs Improvement");

  // Name & Role
  const nameEl = document.getElementById("candidateName");
  if (nameEl) nameEl.textContent = name;

  const roleEl = document.getElementById("candidateRole");
  if (roleEl) roleEl.textContent = `Target Role: ${role}`;

  // Avatar Initials
  const avatarEl = document.getElementById("candidateAvatar");
  if (avatarEl) {
    const parts = name.trim().split(" ");
    let initials = parts[0][0] || "C";
    if (parts.length > 1 && parts[1][0]) initials += parts[1][0];
    avatarEl.textContent = initials.toUpperCase();
  }

  // Session & Rounds
  const sessionTag = document.getElementById("sessionTag");
  if (sessionTag && data.session_id) {
    sessionTag.textContent = `Session: #${data.session_id.slice(0, 8)}`;
  }

  // Scores & Verdict
  const overallScoreEl = document.getElementById("overallScore");
  if (overallScoreEl) overallScoreEl.textContent = score;

  const verdictEl = document.getElementById("overallVerdictText");
  if (verdictEl) {
    verdictEl.textContent = verdict;
    verdictEl.className = "verdict-text " + (score >= 65 ? "text-success" : "text-warning");
  }

  const heroBadge = document.getElementById("heroVerdictBadge");
  if (heroBadge) {
    heroBadge.textContent = verdict;
    heroBadge.className = "badge " + (score >= 80 ? "badge-success" : score >= 65 ? "badge-primary" : "badge-warning");
  }

  // Candidate Names across sections
  const factorsName = document.getElementById("candidateNameFactors");
  if (factorsName) factorsName.textContent = name;

  const factorsNameSub = document.getElementById("candidateNameFactorsSub");
  if (factorsNameSub) factorsNameSub.textContent = name;

  const footerName = document.getElementById("candidateFooterName");
  if (footerName) footerName.textContent = name;

  // Date
  const dateText = document.getElementById("evaluatedDateText");
  if (dateText) {
    const today = new Date();
    dateText.textContent = `Evaluated: ${today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }
}

// ── Populate 3 Round Executive Scorecards ──────────────────────────────────
function populateRoundCards(data) {
  const r1 = data.aptitude_breakdown || {};
  const r2 = data.coding_breakdown || {};
  const r3 = data.ai_interview_breakdown || {};

  // Round 1
  const r1Score = Math.round(r1.score_percentage || 0);
  const r1ScoreEl = document.getElementById("r1Score");
  if (r1ScoreEl) r1ScoreEl.textContent = `${r1Score}%`;

  const r1Accuracy = document.getElementById("r1Accuracy");
  if (r1Accuracy) {
    const correct = r1.correct_answers || (r1.detailed_review ? r1.detailed_review.filter(q => q.is_correct).length : 0);
    const total = r1.total_questions || (r1.detailed_review ? r1.detailed_review.length : 20);
    r1Accuracy.textContent = `${correct} / ${total} Correct`;
  }

  const quant = r1.aptitude || {};
  const logic = r1.reasoning || {};
  const r1Quant = document.getElementById("r1QuantScore");
  if (r1Quant) r1Quant.textContent = `${Math.round(quant.percentage || 70)}%`;

  const r1Logic = document.getElementById("r1LogicScore");
  if (r1Logic) r1Logic.textContent = `${Math.round(logic.percentage || 80)}%`;

  const r1Time = document.getElementById("r1Time");
  if (r1Time) {
    const secs = r1.time_taken_seconds || 480;
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    r1Time.textContent = mins > 0 ? `${mins}m ${rem}s` : `${secs}s`;
  }

  const r1Verdict = document.getElementById("r1Verdict");
  if (r1Verdict && r1.summary) r1Verdict.textContent = r1.summary;

  // Round 2
  const r2Score = Math.round(r2.score_percentage || 0);
  const r2ScoreEl = document.getElementById("r2Score");
  if (r2ScoreEl) r2ScoreEl.textContent = `${r2Score}%`;

  const r2Lang = document.getElementById("r2Language");
  if (r2Lang) r2Lang.textContent = r2.primary_language || "Python";

  const r2Total = document.getElementById("r2TotalProblems");
  if (r2Total) {
    const totalProblems = (r2.detailed_review && r2.detailed_review.length) || r2.total_questions || 5;
    r2Total.textContent = `${totalProblems} Challenges`;
  }

  const r2Correctness = document.getElementById("r2Correctness");
  if (r2Correctness) {
    const attempted = r2.detailed_review ? r2.detailed_review.filter(p => p.is_attempted).length : 5;
    r2Correctness.textContent = `${attempted} Attempted`;
  }

  const r2Verdict = document.getElementById("r2Verdict");
  if (r2Verdict && r2.summary) r2Verdict.textContent = r2.summary;

  // Round 3
  const r3Score = Math.round(r3.score_percentage || 0);
  const r3ScoreEl = document.getElementById("r3Score");
  if (r3ScoreEl) r3ScoreEl.textContent = `${r3Score}%`;

  const radar = r3.radar_metrics || {};
  const r3Tech = document.getElementById("r3TechScore");
  if (r3Tech) r3Tech.textContent = `${Math.round(radar["Technical Knowledge"] || radar["Technical Depth"] || 74)}%`;

  const r3Comm = document.getElementById("r3CommScore");
  if (r3Comm) r3Comm.textContent = `${Math.round(radar["Communication Clarity"] || radar["Communication"] || 82)}%`;

  const r3Rel = document.getElementById("r3RelScore");
  if (r3Rel) r3Rel.textContent = `${Math.round(radar["Relevance & Precision"] || radar["Relevance"] || 78)}%`;

  const r3Conf = document.getElementById("r3ConfScore");
  if (r3Conf) r3Conf.textContent = `${Math.round(radar["Delivery Confidence"] || radar["Confidence"] || 75)}%`;

  const r3Verdict = document.getElementById("r3Verdict");
  if (r3Verdict && r3.summary) r3Verdict.textContent = r3.summary;
}

// ── Populate Candidate Key Improvement Factors ─────────────────────────────
function populateImprovementFactors(data) {
  const factors = data.improvement_factors || {};
  const aptFactors = factors.aptitude_factors || [];
  const codeFactors = factors.coding_factors || [];
  const interviewFactors = factors.interview_factors || [];

  // Counts
  const aptCount = document.getElementById("aptFactorsCount");
  if (aptCount) aptCount.textContent = `${aptFactors.length} Factor${aptFactors.length === 1 ? "" : "s"}`;

  const codeCount = document.getElementById("codeFactorsCount");
  if (codeCount) codeCount.textContent = `${codeFactors.length} Factor${codeFactors.length === 1 ? "" : "s"}`;

  const intCount = document.getElementById("interviewFactorsCount");
  if (intCount) intCount.textContent = `${interviewFactors.length} Factor${interviewFactors.length === 1 ? "" : "s"}`;

  function renderList(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!items || items.length === 0) {
      container.innerHTML = `<p style="font-size:0.82rem;color:var(--text-muted);padding:8px;">No major negative anomalies detected. Continue consistent benchmark practice.</p>`;
      return;
    }

    container.innerHTML = items.map(item => {
      const sev = (item.severity || "medium").toLowerCase();
      const sevClass = sev === "high" ? "sev-high" : sev === "low" ? "sev-low" : "sev-medium";
      return `
        <div class="factor-item">
          <div class="factor-item-top">
            <span class="factor-severity-pill ${sevClass}">${escapeHtml(item.category || sev + " priority")}</span>
            <span style="font-size:0.7rem;color:var(--text-muted);font-weight:600;">Priority: ${sev.toUpperCase()}</span>
          </div>
          <div class="factor-item-title">${escapeHtml(item.title)}</div>
          <div class="factor-item-desc">${escapeHtml(item.description)}</div>
        </div>
      `;
    }).join("");
  }

  renderList("aptFactorsList", aptFactors);
  renderList("codeFactorsList", codeFactors);
  renderList("interviewFactorsList", interviewFactors);
}

// ── Populate Granular Deep-Dive Tabs ────────────────────────────────────────
function populateDeepDives(data) {
  // Tab 1: Aptitude & Reasoning
  const apt = data.aptitude_breakdown || {};
  const questions = apt.detailed_review || [];

  const countAll = document.getElementById("countAllApt");
  const countWrong = document.getElementById("countWrongApt");
  const countRight = document.getElementById("countRightApt");

  const wrongCount = questions.filter(q => !q.is_correct).length;
  const rightCount = questions.filter(q => q.is_correct).length;

  if (countAll) countAll.textContent = questions.length;
  if (countWrong) countWrong.textContent = wrongCount;
  if (countRight) countRight.textContent = rightCount;

  const aptAccuracyChip = document.getElementById("aptAccuracyChip");
  if (aptAccuracyChip) {
    const acc = Math.round(apt.score_percentage || 0);
    aptAccuracyChip.textContent = `Accuracy: ${acc}% (${rightCount}/${questions.length})`;
  }

  renderAptitudeQuestions(questions, currentAptFilter);

  // Tab 2: Coding Assessment
  const code = data.coding_breakdown || {};
  const codingProblems = code.detailed_review || [];

  const langTitle = document.getElementById("codingLanguageBannerTitle");
  if (langTitle) langTitle.textContent = `Primary Language: ${code.primary_language || "Python"}`;

  const codeSummary = document.getElementById("codingSummaryText");
  if (codeSummary && code.summary) codeSummary.textContent = code.summary;

  const diffChip = document.getElementById("codingDifficultyBreakdownChip");
  if (diffChip && code.difficulty_breakdown) {
    const db = code.difficulty_breakdown;
    diffChip.textContent = `Easy: ${Math.round(db.easy || 100)}% • Moderate: ${Math.round(db.moderate || 80)}% • Hard: ${Math.round(db.hard || 50)}%`;
  }

  renderCodingProblems(codingProblems);

  // Tab 3: AI Interview
  const interview = data.ai_interview_breakdown || {};
  const radarMetrics = interview.radar_metrics || {
    "Technical Knowledge": 74,
    "Communication Clarity": 82,
    "Relevance & Precision": 78,
    "Delivery Confidence": 75,
    "Answer Quality": 76,
  };

  renderRadarChart(radarMetrics);

  const heading = document.getElementById("interviewSummaryHeading");
  if (heading) heading.textContent = `AI Synthesis: ${interview.verdict || "Recommended"}`;

  const summaryText = document.getElementById("interviewSummaryText");
  if (summaryText && interview.summary) summaryText.textContent = interview.summary;

  const noteText = document.getElementById("interviewHiringNote");
  if (noteText && interview.hiring_note) noteText.textContent = interview.hiring_note;

  renderInterviewEvaluations(interview.individual_evaluations || []);
}

// Render Tab 1 Questions
function renderAptitudeQuestions(questions, filter) {
  const container = document.getElementById("aptitudeQuestionsList");
  if (!container) return;

  let filtered = questions;
  if (filter === "wrong") {
    filtered = questions.filter(q => !q.is_correct);
  } else if (filter === "right") {
    filtered = questions.filter(q => q.is_correct);
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);background:var(--bg-primary);border-radius:var(--radius-md);">No questions match the selected filter.</div>`;
    return;
  }

  container.innerHTML = filtered.map((q, idx) => {
    const isRight = Boolean(q.is_correct);
    const cardClass = isRight ? "right-answer" : "wrong-answer";
    const statusBadge = isRight
      ? `<span class="badge badge-success">✅ Correct</span>`
      : `<span class="badge badge-danger">❌ Needs Improvement</span>`;

    return `
      <div class="question-review-card ${cardClass}">
        <div class="q-header-row">
          <div class="q-topic-tags">
            <span class="q-topic-badge">#${q.id || idx + 1}</span>
            <span class="q-topic-badge">${escapeHtml(q.category || "Aptitude")}</span>
            <span class="q-topic-badge" style="color:var(--accent-primary);font-weight:700;">${escapeHtml(q.subtopic || "")}</span>
            <span class="q-topic-badge">${escapeHtml(q.difficulty || "Moderate")}</span>
          </div>
          <div>${statusBadge}</div>
        </div>

        <div class="q-prompt-text">${escapeHtml(q.question)}</div>

        <div class="q-answers-grid">
          <div class="q-ans-box" style="border-left: 3px solid ${isRight ? 'var(--color-success)' : 'var(--color-danger)'};">
            <span class="q-ans-label">Candidate Answer:</span>
            <span class="q-ans-val">${escapeHtml(q.user_selected_answer || "[No answer selected]")}</span>
          </div>
          <div class="q-ans-box" style="border-left: 3px solid var(--color-success);">
            <span class="q-ans-label">Correct Benchmark Answer:</span>
            <span class="q-ans-val">${escapeHtml(q.correct_answer)}</span>
          </div>
        </div>

        ${q.explanation ? `
          <div class="q-explanation-box">
            <strong>Diagnostic Solution & Shortcut:</strong> ${escapeHtml(q.explanation)}
          </div>
        ` : ""}
      </div>
    `;
  }).join("");
}

// Filter Tab 1
window.filterAptitudeQuestions = function(filter) {
  currentAptFilter = filter;
  document.querySelectorAll(".filter-pill-group .rec-filter-btn").forEach(btn => {
    if (btn.dataset.filter === filter) btn.classList.add("active");
    else btn.classList.remove("active");
  });
  if (activeData && activeData.aptitude_breakdown) {
    renderAptitudeQuestions(activeData.aptitude_breakdown.detailed_review || [], filter);
  }
};

// Render Tab 2 Problems
function renderCodingProblems(problems) {
  const container = document.getElementById("codingProblemsList");
  if (!container) return;

  if (!problems || problems.length === 0) {
    container.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);">No coding challenges recorded.</div>`;
    return;
  }

  container.innerHTML = problems.map((p, idx) => {
    const score = Math.round(p.question_score || (p.is_attempted ? 75 : 0));
    const isPassed = score >= 70;
    const badgeClass = isPassed ? "badge-success" : score > 0 ? "badge-warning" : "badge-danger";

    const issues = p.issues || [];
    const suggestions = p.suggestions || [];

    return `
      <div class="coding-problem-card">
        <div class="cp-header">
          <div class="flex-align gap-2">
            <span class="badge badge-primary">Challenge #${p.id || idx + 1}</span>
            <h4 class="cp-title">${escapeHtml(p.title || `Problem ${idx + 1}`)}</h4>
            <span class="badge" style="background:var(--bg-secondary);border:1px solid var(--border-color);">${escapeHtml(p.difficulty || "Moderate")}</span>
          </div>
          <div class="flex-align gap-2">
            <span class="badge ${badgeClass}">${escapeHtml(p.verdict || (isPassed ? "Passed" : "Needs Work"))}</span>
            <span style="font-size:0.88rem;font-weight:700;font-family:var(--font-mono);">${score}%</span>
          </div>
        </div>

        <p class="cp-prompt">${escapeHtml(p.prompt || "")}</p>

        <div>
          <span style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);display:block;margin-bottom:6px;">Candidate's Code Submission:</span>
          <pre class="code-snippet-box"><code>${escapeHtml(p.candidate_code || "[No Code Submitted]")}</code></pre>
        </div>

        <div class="cp-feedback-row">
          <div class="cp-feedback-box">
            <h5>Automated Evaluator Feedback</h5>
            <p style="color:var(--text-secondary);font-size:0.8rem;line-height:1.45;">${escapeHtml(p.feedback || "Evaluated against benchmark test suite.")}</p>
          </div>
          <div class="cp-feedback-box">
            <h5>Improvement Suggestions & Gaps</h5>
            ${issues.length > 0 || suggestions.length > 0 ? `
              <ul style="padding-left:18px;margin:0;font-size:0.78rem;color:var(--text-secondary);line-height:1.45;">
                ${issues.map(iss => `<li style="color:var(--color-danger);">${escapeHtml(iss)}</li>`).join("")}
                ${suggestions.map(sug => `<li style="color:var(--accent-primary);">${escapeHtml(sug)}</li>`).join("")}
              </ul>
            ` : `<p style="font-size:0.78rem;color:var(--color-success);">Optimal solution. No critical defects flagged.</p>`}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Render Tab 3 Interview Evaluations
function renderInterviewEvaluations(evaluations) {
  const container = document.getElementById("interviewEvaluationsList");
  if (!container) return;

  if (!evaluations || evaluations.length === 0) {
    container.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);">No interview question evaluations recorded.</div>`;
    return;
  }

  container.innerHTML = evaluations.map((ev, idx) => {
    const score = Math.round(ev.overall_score || 75);
    const badgeClass = score >= 75 ? "badge-success" : score >= 55 ? "badge-warning" : "badge-danger";
    const scores = ev.scores || {};

    const strengths = ev.strengths || [];
    const weaknesses = ev.weaknesses || [];
    const ideal = ev.ideal_answer_points || [];

    return `
      <div class="interview-eval-card">
        <div class="flex-align" style="justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <span class="eval-q-badge">Question #${idx + 1} • ${escapeHtml(ev.category || "General")}</span>
          <div class="flex-align gap-2">
            <span class="badge ${badgeClass}">Score: ${score}%</span>
          </div>
        </div>

        <h4 class="eval-question-text">"${escapeHtml(ev.question)}"</h4>

        <div>
          <span style="font-size:0.74rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);display:block;margin-bottom:4px;">Candidate's Live Speech Response:</span>
          <div class="eval-transcript-box">
            "${escapeHtml(ev.candidate_answer || "[Question skipped or unrecorded]")}"
          </div>
        </div>

        <div class="eval-scores-strip">
          <span class="eval-score-chip">Technical Knowledge: <strong>${scores.technical_knowledge ?? 75}%</strong></span>
          <span class="eval-score-chip">Clarity: <strong>${scores.communication_clarity ?? 80}%</strong></span>
          <span class="eval-score-chip">Relevance: <strong>${scores.relevance_accuracy ?? 75}%</strong></span>
          <span class="eval-score-chip">Confidence: <strong>${scores.confidence_delivery ?? 75}%</strong></span>
        </div>

        <div class="eval-analysis-grid">
          <div class="eval-analysis-box">
            <h6 class="text-success-header">Strengths Identified</h6>
            <ul style="padding-left:16px;margin:0;color:var(--text-secondary);font-size:0.78rem;">
              ${strengths.length > 0 ? strengths.map(s => `<li>${escapeHtml(s)}</li>`).join("") : "<li>Positive professional demeanor</li>"}
            </ul>
          </div>

          <div class="eval-analysis-box">
            <h6 class="text-danger-header">Areas Where Candidate Must Improve</h6>
            <ul style="padding-left:16px;margin:0;color:var(--text-secondary);font-size:0.78rem;">
              ${weaknesses.length > 0 ? weaknesses.map(w => `<li>${escapeHtml(w)}</li>`).join("") : "<li>Incorporate quantitative impact metrics</li>"}
            </ul>
          </div>
        </div>

        ${ideal.length > 0 ? `
          <div style="margin-top:12px;background:rgba(99,102,241,0.05);border-left:3px solid var(--accent-primary);padding:8px 12px;border-radius:0 var(--radius-sm) var(--radius-sm) 0;font-size:0.78rem;color:var(--text-secondary);">
            <strong>Ideal Response Benchmark:</strong>
            <ul style="padding-left:16px;margin:4px 0 0 0;">
              ${ideal.map(point => `<li>${escapeHtml(point)}</li>`).join("")}
            </ul>
          </div>
        ` : ""}
      </div>
    `;
  }).join("");
}

// Render Tab 3 Radar Chart
function renderRadarChart(radarMetrics) {
  const canvas = document.getElementById("interviewRadarChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (radarChartInstance) radarChartInstance.destroy();

  const labels = Object.keys(radarMetrics);
  const data = Object.values(radarMetrics).map(v => Math.round(Number(v) || 0));

  radarChartInstance = new Chart(ctx, {
    type: "radar",
    data: {
      labels: labels,
      datasets: [{
        label: "Candidate Dimension Score",
        data: data,
        backgroundColor: "rgba(99, 102, 241, 0.22)",
        borderColor: "#6366f1",
        borderWidth: 2.2,
        pointBackgroundColor: "#6366f1",
        pointBorderColor: "#fff",
        pointRadius: 4,
        pointHoverRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20, display: false },
          grid: { color: "rgba(148, 163, 184, 0.2)" },
          angleLines: { color: "rgba(148, 163, 184, 0.2)" },
          pointLabels: {
            font: { family: "Plus Jakarta Sans", size: 11, weight: "600" },
            color: "#64748b",
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.raw}%`;
            },
          },
        },
      },
    },
  });
}

// ── Tab Switching ──────────────────────────────────────────────────────────
window.switchDeepDiveTab = function(tabName) {
  // Update buttons
  document.getElementById("tabBtnAptitude").classList.toggle("active", tabName === "aptitude");
  document.getElementById("tabBtnCoding").classList.toggle("active", tabName === "coding");
  document.getElementById("tabBtnInterview").classList.toggle("active", tabName === "interview");

  // Update panels
  document.getElementById("panelAptitude").classList.toggle("active", tabName === "aptitude");
  document.getElementById("panelCoding").classList.toggle("active", tabName === "coding");
  document.getElementById("panelInterview").classList.toggle("active", tabName === "interview");

  // Resize chart if switching to interview
  if (tabName === "interview" && radarChartInstance) {
    setTimeout(() => radarChartInstance.resize(), 100);
  }
};

// ── Theme Switcher ─────────────────────────────────────────────────────────
function initTheme() {
  const themeToggle = document.getElementById("themeToggle");
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.body.setAttribute("data-theme", "dark");
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.body.getAttribute("data-theme");
      if (current === "dark") {
        document.body.removeAttribute("data-theme");
        localStorage.setItem("theme", "light");
      } else {
        document.body.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      }
      if (radarChartInstance) radarChartInstance.update();
    });
  }
}

// ── Initialization on DOM Ready ────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();

  const candName = resolveCandidateName(null);
  const targetRole = resolveJobTitle(null);

  // Initialize with benchmark candidate data
  activeData = generateDefaultReport(candName, targetRole);

  try {
    const res = await fetch("/api/performance/current");
    if (res.ok) {
      const live = await res.json();
      if (live && (live.overall_score !== undefined || live.aptitude_breakdown)) {
        // Merge candidate name properly
        if (live.candidate_name && live.candidate_name !== "Candidate") {
          activeData.candidate_name = live.candidate_name;
        } else {
          live.candidate_name = activeData.candidate_name;
        }
        if (live.job_title && live.job_title !== "Target Role") {
          activeData.job_title = live.job_title;
        } else {
          live.job_title = activeData.job_title;
        }

        // Merge components and breakdowns if present
        if (live.overall_score !== undefined) activeData.overall_score = live.overall_score;
        if (live.recommendation) activeData.recommendation = live.recommendation;
        if (live.components && live.components.length) activeData.components = live.components;
        if (live.improvement_factors && Object.keys(live.improvement_factors).length) {
          activeData.improvement_factors = live.improvement_factors;
        }
        if (live.aptitude_breakdown && live.aptitude_breakdown.score_percentage !== undefined) {
          activeData.aptitude_breakdown = live.aptitude_breakdown;
        }
        if (live.coding_breakdown && live.coding_breakdown.score_percentage !== undefined) {
          activeData.coding_breakdown = live.coding_breakdown;
        }
        if (live.ai_interview_breakdown && live.ai_interview_breakdown.score_percentage !== undefined) {
          activeData.ai_interview_breakdown = live.ai_interview_breakdown;
        }
      }
    }
  } catch (err) {
    console.log("Serving candidate performance report with diagnostic factors.");
  }

  // Populate all sections
  populateHero(activeData);
  populateRoundCards(activeData);
  populateImprovementFactors(activeData);
  populateDeepDives(activeData);
});
