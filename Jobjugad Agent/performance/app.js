// Candidate Data Repository with Enhanced Right & Wrong Answer Tracking for Stage 1 & Stage 2
const candidates = [
  {
    id: 0,
    name: "Aarav Sharma",
    role: "Senior Backend / Full-Stack Engineer",
    avatar: "AS",
    verdict: "Strong Hire",
    verdictClass: "badge-success",
    aptitudeScore: 92,
    codingScore: 4.8,
    interviewScore: 4.7,
    complexity: "O(n) Optimal",
    bluffingRisk: "Zero Risk",
    bluffingClass: "badge-success",
    speechMetrics: { wpm: 138, fillers: "1.2/min", hesitation: "0.9s", confidence: "96%" },
    debriefScript: "Executive debrief for Aarav Sharma. Candidate demonstrated top five percent algorithmic logic with optimal Big-O complexity. Zero bluffing detected during resume cross-examination on distributed Kafka systems. Highly articulate with strong ownership mindset. Recommendation: Extend immediate Tier-1 Senior Software Engineer offer.",
    metrics: {
      problemSolving: 95,
      codingEfficiency: 96,
      systemDesign: 92,
      communication: 94,
      authenticity: 98
    },
    aptitudeNotes: "Top 5 percentile. Solved intricate pattern recognition and dynamic resource-allocation without scratchpad calculation. 23 Correct, 2 Incorrect out of 25 questions.",
    codingNotes: "Authored modular TypeScript backend services with native handling of distributed locking, edge cases, and race conditions. 5 of 5 Coding Test Suites passed.",
    interviewNotes: "Resume verified 100%. Deep technical details matched production contributions. Transparently declared limits regarding Kafka rebalancing edge cases without bluffing.",
    strengths: [
      "Optimal algorithmic efficiency (O(n) runtime, O(1) space)",
      "High architectural maturity & concurrency awareness",
      "Authentic, humble, and articulate communication"
    ],
    weaknesses: [
      "Could deepen cloud FinOps / cloud infrastructure cost optimization"
    ],
    roadmap: {
      d30: "Lead high-throughput backend service integration; conduct code review baseline.",
      d60: "Optimize database caching layers and participate in core architecture syncs.",
      d90: "Anchor system design reviews and mentor junior SDEs on concurrency paradigms."
    },
    action: "Extend immediate Tier-1 Senior Software Engineer offer within 24h.",
    stage1Answers: [
      { id: 1, topic: "Logical Deduction", question: "If all Zips are Zaps and no Zaps are Zops, are some Zips Zops?", candidateAnswer: "No, impossible for any Zip to be a Zop", correctAnswer: "No, impossible for any Zip to be a Zop", isRight: true, timeTaken: "18s", explanation: "Transitive deduction correctly applied." },
      { id: 2, topic: "Quantitative Logic", question: "Work completion rate: A takes 6h, B takes 8h. Together with C they take 2.4h. Find C's alone time.", candidateAnswer: "8.0 hours", correctAnswer: "8.0 hours", isRight: true, timeTaken: "34s", explanation: "1/6 + 1/8 + 1/C = 1/2.4 => C = 8h." },
      { id: 3, topic: "Pattern Recognition", question: "Identify next term in sequence: 3, 7, 15, 31, 63, ?", candidateAnswer: "127 (2^n - 1 progression)", correctAnswer: "127", isRight: true, timeTaken: "12s", explanation: "Double plus 1 sequence deduced instantly." },
      { id: 4, topic: "Data Interpretation", question: "Calculate net quarterly growth margin from 4-node revenue graph with amortized depreciation.", candidateAnswer: "14.25%", correctAnswer: "14.25%", isRight: true, timeTaken: "45s", explanation: "Multi-step percentage variance calculated accurately." },
      { id: 5, topic: "Bitwise Reasoning", question: "Given x ^ y = 0, what is the fundamental mathematical relationship between x and y?", candidateAnswer: "x == y (Identical bit representation)", correctAnswer: "x == y", isRight: true, timeTaken: "8s", explanation: "XOR self-annihilation property applied." },
      { id: 6, topic: "Probability", question: "Probability of picking at least one defective chip in 3 draws without replacement from 20 (with 4 defective).", candidateAnswer: "49.12%", correctAnswer: "49.12%", isRight: true, timeTaken: "52s", explanation: "Complementary probability 1 - (16/20 * 15/19 * 14/18) solved." },
      { id: 7, topic: "Syllogism & Sets", question: "Venn intersection: (A ∪ B) ∩ (A ∪ C) equivalence in set boolean algebra.", candidateAnswer: "A ∪ (B ∩ C)", correctAnswer: "A ∪ (B ∩ C)", isRight: true, timeTaken: "20s", explanation: "Distributive law correctly simplified." },
      { id: 8, topic: "Critical Reasoning", question: "Identify the flawed assumption in company's employee retention versus salary claim.", candidateAnswer: "Assumes salary is sole independent variable ignoring managerial friction", correctAnswer: "Assumes correlation implies sole causation", isRight: true, timeTaken: "38s", explanation: "Causal fallacy correctly flagged." },
      { id: 9, topic: "Time & Distance", question: "Two trains moving towards each other at 60 km/h and 90 km/h separated by 300 km. Collision countdown?", candidateAnswer: "2.0 hours (300 / 150)", correctAnswer: "2.0 hours", isRight: true, timeTaken: "15s", explanation: "Relative velocity evaluated instantly." },
      { id: 10, topic: "Combinatorics", question: "Number of unique 4-character permutations with at least one special symbol from set of 10 alphanumerics and 3 symbols.", candidateAnswer: "12,141 combinations", correctAnswer: "18,561 combinations", isRight: false, timeTaken: "65s", explanation: "Calculation discrepancy on unrestricted exponent calculation." },
      { id: 11, topic: "Algorithmic Tracing", question: "State complexity class of finding median in two sorted arrays of size m and n.", candidateAnswer: "O(log(min(m, n))) via binary partition", correctAnswer: "O(log(min(m, n)))", isRight: true, timeTaken: "22s", explanation: "Optimal median search complexity quoted." },
      { id: 12, topic: "Spatial Reasoning", question: "3D cube rotation with colored opposite faces after 3 compound axial rotations.", candidateAnswer: "Yellow face on Top, Blue on Right", correctAnswer: "Yellow face on Top, Blue on Right", isRight: true, timeTaken: "29s", explanation: "Spatial transformation mapped mentally." },
      { id: 13, topic: "Modulo Arithmetic", question: "Find remainder when 7^100 is divided by 10.", candidateAnswer: "1 (Cycles: 7, 9, 3, 1 -> 100 mod 4 = 0)", correctAnswer: "1", isRight: true, timeTaken: "19s", explanation: "Cycle period analysis executed flawlessly." },
      { id: 14, topic: "Financial Reasoning", question: "Compound interest vs simple interest difference over 2 years at 10% on $10,000 principal.", candidateAnswer: "$100", correctAnswer: "$100", isRight: true, timeTaken: "14s", explanation: "P*(r/100)^2 shortcut applied." },
      { id: 15, topic: "Matrix Transformation", question: "Determinant of 3x3 upper triangular matrix with diagonal elements 2, 5, 8.", candidateAnswer: "80 (Product of diagonal elements)", correctAnswer: "80", isRight: true, timeTaken: "10s", explanation: "Triangular matrix property utilized." },
      { id: 16, topic: "Game Theory Logic", question: "Nim game optimal first move with heaps (3, 4, 5).", candidateAnswer: "Nim-sum = 3 ^ 4 ^ 5 = 2. Reduce heap 5 to 3.", correctAnswer: "Reduce heap 5 to 3", isRight: true, timeTaken: "48s", explanation: "XOR nim-sum balance strategy applied." },
      { id: 17, topic: "Network Flow Logic", question: "Max flow min cut theorem: capacity of cut (S, T) given saturated edge weights.", candidateAnswer: "28 units", correctAnswer: "28 units", isRight: true, timeTaken: "42s", explanation: "Min-cut bottle neck accurately summed." },
      { id: 18, topic: "Deductive Grid", question: "Logic puzzle: 5 developers with different IDEs, languages, and coffee preferences. Who codes Rust?", candidateAnswer: "Developer in Office #4 (Aarav deduced)", correctAnswer: "Developer in Office #4", isRight: true, timeTaken: "68s", explanation: "Elimination matrix solved cleanly." },
      { id: 19, topic: "Graph Theory", question: "Minimum number of colors needed to color vertices of planar graph with no adjacent same colors.", candidateAnswer: "4 (Four Color Theorem)", correctAnswer: "4", isRight: true, timeTaken: "11s", explanation: "Fundamental planar graph theorem answered." },
      { id: 20, topic: "Statistical Inference", question: "Interpretation of p-value < 0.01 in A/B latency benchmark.", candidateAnswer: "Less than 1% probability observed difference occurred under null hypothesis", correctAnswer: "Reject null hypothesis at 99% confidence", isRight: true, timeTaken: "25s", explanation: "Precise statistical definition provided." },
      { id: 21, topic: "Clock Angle Puzzle", question: "Angle between hour and minute hand at exactly 3:15.", candidateAnswer: "7.5 degrees (Minute hand at 90°, hour hand at 97.5°)", correctAnswer: "7.5 degrees", isRight: true, timeTaken: "16s", explanation: "Hour hand movement calculation exact." },
      { id: 22, topic: "Recursive Relation", question: "Solve recurrence T(n) = 2T(n/2) + O(n).", candidateAnswer: "O(n log n) by Master Theorem Case 2", correctAnswer: "O(n log n)", isRight: true, timeTaken: "14s", explanation: "Master theorem correctly recalled." },
      { id: 23, topic: "Conditional Probability", question: "Monty Hall problem: probability of winning car if contestant switches door.", candidateAnswer: "2/3 (66.7%)", correctAnswer: "2/3", isRight: true, timeTaken: "12s", explanation: "Bayesian probability switch advantage identified." },
      { id: 24, topic: "Cryptarithmetic", question: "Solve SEND + MORE = MONEY for letter 'M' and 'O'.", candidateAnswer: "M = 1, O = 0", correctAnswer: "M = 1, O = 0", isRight: true, timeTaken: "36s", explanation: "Leading digit carry-over deduction accurate." },
      { id: 25, topic: "Data Sufficiency", question: "Is integer N divisible by 6? Statement 1: N divisible by 3. Statement 2: N is even.", candidateAnswer: "Statement 1 alone is sufficient", correctAnswer: "Both statements TOGETHER are sufficient", isRight: false, timeTaken: "22s", explanation: "Rushed data sufficiency check; overlooked statement 2 necessity." }
    ],
    stage2Problems: [
      { id: 1, title: "High-Throughput LRU Cache with TTL Eviction", topic: "Data Structures & Concurrency", targetComplexity: "O(1) Get/Put", complexity: "O(1) Optimal", passedTestCases: "12/12", isRight: true, keyEdgeCase: "Race condition on concurrent expiration & eviction lock", notes: "Flawless doubly linked list + hash map with read-write mutex lock." },
      { id: 2, title: "Distributed Rate Limiter (Token Bucket)", topic: "System Logic & Algorithms", targetComplexity: "O(1) Token Refill", complexity: "O(1) Optimal", passedTestCases: "10/10", isRight: true, keyEdgeCase: "Clock drift across server nodes & burst overflow", notes: "Lua atomic script simulation with sliding window counter." },
      { id: 3, title: "Sliding Window Maximum over Stream", topic: "Algorithmic Efficiency", targetComplexity: "O(n) Time, O(k) Space", complexity: "O(n) Optimal", passedTestCases: "15/15", isRight: true, keyEdgeCase: "Strict monotonic deque maintenance on negative integers", notes: "Optimal double-ended queue approach without re-scans." },
      { id: 4, title: "Graph Cycle Detection in Microservice Dependency DAG", topic: "Graph Algorithms", targetComplexity: "O(V + E)", complexity: "O(V + E) Optimal", passedTestCases: "8/8", isRight: true, keyEdgeCase: "Disconnected components & self-referencing nodes", notes: "Tarjan / Kahn's topological sort with color tagging." },
      { id: 5, title: "Lock-Free Bounded Queue Ring Buffer", topic: "Low-Level Memory & Concurrency", targetComplexity: "O(1) Non-blocking", complexity: "O(1) Optimal", passedTestCases: "14/14", isRight: true, keyEdgeCase: "ABA problem mitigation with atomic pointer tags", notes: "Mastery of atomic compare-and-swap primitives." }
    ]
  },
  {
    id: 1,
    name: "Priya Nair",
    role: "Software Development Engineer (SDE-II)",
    avatar: "PN",
    verdict: "Hire",
    verdictClass: "badge-primary",
    aptitudeScore: 84,
    codingScore: 3.8,
    interviewScore: 4.0,
    complexity: "O(n log n) Refactored",
    bluffingRisk: "Zero Risk",
    bluffingClass: "badge-success",
    speechMetrics: { wpm: 126, fillers: "3.5/min", hesitation: "1.4s", confidence: "84%" },
    debriefScript: "Executive debrief for Priya Nair. Solid problem-solving fundamentals and high coachability. Refactored initial solution to optimal runtime with minimal interviewer hint. Open and honest about technical knowledge boundaries with no bluffing. Recommendation: Roll out SDE-Two offer with assigned mentor for first ninety days.",
    metrics: {
      problemSolving: 84,
      codingEfficiency: 76,
      systemDesign: 78,
      communication: 82,
      authenticity: 95
    },
    aptitudeNotes: "Deliberate and structured problem solver. Low error rate due to careful pacing and methodical scratchpad notes. 21 Correct, 4 Incorrect out of 25 questions.",
    codingNotes: "Solid fundamental grasp of Tree/Graph structures. Initial approach was O(n^2), but quickly refactored to O(n log n) with minimal hint. 4 of 5 Test Suites passed.",
    interviewNotes: "Genuine project experiences. Readily admitted lack of hands-on Kubernetes orchestration experience rather than guessing.",
    strengths: [
      "Strong fundamental logic & analytical rigor",
      "High coachability during interactive coding",
      "Grounded and honest technical self-awareness"
    ],
    weaknesses: [
      "Needs practice writing high-throughput concurrent systems"
    ],
    roadmap: {
      d30: "Pair-program on core microservices with assigned Senior Staff Mentor.",
      d60: "Take ownership of independent REST API endpoints and integration tests.",
      d90: "Independently deploy multi-service PRs and review telemetry metrics."
    },
    action: "Roll out SDE-II offer paired with Senior Mentor for first 90 days.",
    stage1Answers: [
      { id: 1, topic: "Logical Deduction", question: "If all Zips are Zaps and no Zaps are Zops, are some Zips Zops?", candidateAnswer: "No, impossible for any Zip to be a Zop", correctAnswer: "No, impossible for any Zip to be a Zop", isRight: true, timeTaken: "24s", explanation: "Correctly resolved." },
      { id: 2, topic: "Quantitative Logic", question: "Work completion rate: A takes 6h, B takes 8h. Together with C they take 2.4h. Find C's alone time.", candidateAnswer: "8.0 hours", correctAnswer: "8.0 hours", isRight: true, timeTaken: "48s", explanation: "Step-by-step scratchpad derivation." },
      { id: 3, topic: "Pattern Recognition", question: "Identify next term in sequence: 3, 7, 15, 31, 63, ?", candidateAnswer: "127", correctAnswer: "127", isRight: true, timeTaken: "15s", explanation: "Quick deduction." },
      { id: 4, topic: "Data Interpretation", question: "Calculate net quarterly growth margin from 4-node revenue graph with amortized depreciation.", candidateAnswer: "14.25%", correctAnswer: "14.25%", isRight: true, timeTaken: "58s", explanation: "Calculated with accurate margin tables." },
      { id: 5, topic: "Bitwise Reasoning", question: "Given x ^ y = 0, what is the fundamental mathematical relationship between x and y?", candidateAnswer: "x == y", correctAnswer: "x == y", isRight: true, timeTaken: "11s", explanation: "Accurate." },
      { id: 6, topic: "Probability", question: "Probability of picking at least one defective chip in 3 draws without replacement from 20 (with 4 defective).", candidateAnswer: "49.12%", correctAnswer: "49.12%", isRight: true, timeTaken: "62s", explanation: "Accurate fractional subtraction." },
      { id: 7, topic: "Syllogism & Sets", question: "Venn intersection: (A ∪ B) ∩ (A ∪ C) equivalence in set boolean algebra.", candidateAnswer: "A ∩ (B ∪ C)", correctAnswer: "A ∪ (B ∩ C)", isRight: false, timeTaken: "35s", explanation: "Inverted union and intersection operator precedence." },
      { id: 8, topic: "Critical Reasoning", question: "Identify the flawed assumption in company's employee retention versus salary claim.", candidateAnswer: "Assumes correlation implies sole causation", correctAnswer: "Assumes correlation implies sole causation", isRight: true, timeTaken: "41s", explanation: "Identified causal fallacy." },
      { id: 9, topic: "Time & Distance", question: "Two trains moving towards each other at 60 km/h and 90 km/h separated by 300 km. Collision countdown?", candidateAnswer: "2.0 hours", correctAnswer: "2.0 hours", isRight: true, timeTaken: "21s", explanation: "Relative speed formula applied." },
      { id: 10, topic: "Combinatorics", question: "Number of unique 4-character permutations with at least one special symbol from set of 10 alphanumerics and 3 symbols.", candidateAnswer: "18,561 combinations", correctAnswer: "18,561 combinations", isRight: true, timeTaken: "70s", explanation: "Full complement subtraction worked out." },
      { id: 11, topic: "Algorithmic Tracing", question: "State complexity class of finding median in two sorted arrays of size m and n.", candidateAnswer: "O(log(m + n))", correctAnswer: "O(log(min(m, n)))", isRight: false, timeTaken: "30s", explanation: "Slightly unoptimized upper bound quoted." },
      { id: 12, topic: "Spatial Reasoning", question: "3D cube rotation with colored opposite faces after 3 compound axial rotations.", candidateAnswer: "Yellow face on Top, Blue on Right", correctAnswer: "Yellow face on Top, Blue on Right", isRight: true, timeTaken: "38s", explanation: "Visual rotation verified." },
      { id: 13, topic: "Modulo Arithmetic", question: "Find remainder when 7^100 is divided by 10.", candidateAnswer: "1", correctAnswer: "1", isRight: true, timeTaken: "25s", explanation: "Unit digit cyclicity method." },
      { id: 14, topic: "Financial Reasoning", question: "Compound interest vs simple interest difference over 2 years at 10% on $10,000 principal.", candidateAnswer: "$100", correctAnswer: "$100", isRight: true, timeTaken: "19s", explanation: "Accurate calculation." },
      { id: 15, topic: "Matrix Transformation", question: "Determinant of 3x3 upper triangular matrix with diagonal elements 2, 5, 8.", candidateAnswer: "80", correctAnswer: "80", isRight: true, timeTaken: "14s", explanation: "Diagonal multiplication." },
      { id: 16, topic: "Game Theory Logic", question: "Nim game optimal first move with heaps (3, 4, 5).", candidateAnswer: "Reduce heap 5 to 3", correctAnswer: "Reduce heap 5 to 3", isRight: true, timeTaken: "55s", explanation: "Derived nim-sum." },
      { id: 17, topic: "Network Flow Logic", question: "Max flow min cut theorem: capacity of cut (S, T) given saturated edge weights.", candidateAnswer: "28 units", correctAnswer: "28 units", isRight: true, timeTaken: "49s", explanation: "Accurate summation." },
      { id: 18, topic: "Deductive Grid", question: "Logic puzzle: 5 developers with different IDEs, languages, and coffee preferences. Who codes Rust?", candidateAnswer: "Developer in Office #4", correctAnswer: "Developer in Office #4", isRight: true, timeTaken: "82s", explanation: "Methodical grid elimination." },
      { id: 19, topic: "Graph Theory", question: "Minimum number of colors needed to color vertices of planar graph with no adjacent same colors.", candidateAnswer: "4", correctAnswer: "4", isRight: true, timeTaken: "15s", explanation: "Correct theorem recall." },
      { id: 20, topic: "Statistical Inference", question: "Interpretation of p-value < 0.01 in A/B latency benchmark.", candidateAnswer: "Statistically significant evidence against null hypothesis", correctAnswer: "Reject null hypothesis at 99% confidence", isRight: true, timeTaken: "29s", explanation: "Clear comprehension." },
      { id: 21, topic: "Clock Angle Puzzle", question: "Angle between hour and minute hand at exactly 3:15.", candidateAnswer: "0 degrees (Both pointing at 3)", correctAnswer: "7.5 degrees", isRight: false, timeTaken: "18s", explanation: "Forgot the continuous motion of the hour hand." },
      { id: 22, topic: "Recursive Relation", question: "Solve recurrence T(n) = 2T(n/2) + O(n).", candidateAnswer: "O(n log n)", correctAnswer: "O(n log n)", isRight: true, timeTaken: "18s", explanation: "Master Theorem applied." },
      { id: 23, topic: "Conditional Probability", question: "Monty Hall problem: probability of winning car if contestant switches door.", candidateAnswer: "2/3", correctAnswer: "2/3", isRight: true, timeTaken: "17s", explanation: "Correctly answered." },
      { id: 24, topic: "Cryptarithmetic", question: "Solve SEND + MORE = MONEY for letter 'M' and 'O'.", candidateAnswer: "M = 1, O = 0", correctAnswer: "M = 1, O = 0", isRight: true, timeTaken: "44s", explanation: "Step-by-step carryover logic." },
      { id: 25, topic: "Data Sufficiency", question: "Is integer N divisible by 6? Statement 1: N divisible by 3. Statement 2: N is even.", candidateAnswer: "Statement 2 alone is sufficient", correctAnswer: "Both statements TOGETHER are sufficient", isRight: false, timeTaken: "28s", explanation: "Missed requiring both factor 2 and factor 3." }
    ],
    stage2Problems: [
      { id: 1, title: "High-Throughput LRU Cache with TTL Eviction", topic: "Data Structures & Concurrency", targetComplexity: "O(1) Get/Put", complexity: "O(1) Optimal", passedTestCases: "12/12", isRight: true, keyEdgeCase: "Capacity boundary & quick node relinking", notes: "Clean implementation of DLL + Map." },
      { id: 2, title: "Distributed Rate Limiter (Token Bucket)", topic: "System Logic & Algorithms", targetComplexity: "O(1) Token Refill", complexity: "O(n log n) Moderate", passedTestCases: "8/10", isRight: false, keyEdgeCase: "High concurrency race during lock acquisition", notes: "Missed atomicity in redis script; initial attempt had lock starvation." },
      { id: 3, title: "Sliding Window Maximum over Stream", topic: "Algorithmic Efficiency", targetComplexity: "O(n) Time, O(k) Space", complexity: "O(n log n) Refactored", passedTestCases: "15/15", isRight: true, keyEdgeCase: "Initial O(n*k) refactored to MaxHeap upon interviewer hint", notes: "Coachable; responded fast to performance guidance." },
      { id: 4, title: "Graph Cycle Detection in Microservice Dependency DAG", topic: "Graph Algorithms", targetComplexity: "O(V + E)", complexity: "O(V + E) Optimal", passedTestCases: "8/8", isRight: true, keyEdgeCase: "Cycle back-edge in directed graphs", notes: "DFS with recursion stack state tracking." },
      { id: 5, title: "Binary Search Tree Validation & Rebalancing", topic: "Trees & Recursion", targetComplexity: "O(n) Time, O(h) Space", complexity: "O(n) Optimal", passedTestCases: "10/10", isRight: true, keyEdgeCase: "Node values on subtree extremes exceeding ancestor bounds", notes: "Handled min/max range propagation cleanly." }
    ]
  },
  {
    id: 2,
    name: "Vikram Mehta",
    role: "Backend Systems Engineer",
    avatar: "VM",
    verdict: "Reject",
    verdictClass: "badge-danger",
    aptitudeScore: 78,
    codingScore: 3.1,
    interviewScore: 2.0,
    complexity: "O(n²) Brute Force",
    bluffingRisk: "High Risk",
    bluffingClass: "badge-danger",
    speechMetrics: { wpm: 168, fillers: "7.8/min", hesitation: "3.2s", confidence: "45%" },
    debriefScript: "Executive debrief for Vikram Mehta. Critical integrity and technical depth discrepancies flagged. Resume claimed architecture of five hundred thousand requests per second, but candidate was unable to explain basic database sharding or idempotency under probing. Recommendation: Disqualify candidate.",
    metrics: {
      problemSolving: 78,
      codingEfficiency: 60,
      systemDesign: 40,
      communication: 50,
      authenticity: 30
    },
    aptitudeNotes: "Standard reasoning ability; struggled with complex multi-variable optimization problems under timed conditions. 19 Correct, 6 Incorrect out of 25 questions.",
    codingNotes: "Implemented a working Graph BFS, but code was fragile with hardcoded values, poor variable naming, and high memory allocations. 3 of 5 Test Suites passed.",
    interviewNotes: "High inflation detected. Listed 'Architected 500k RPS systems', but failed to explain database sharding, idempotency keys, or failover. Deflected and used evasive buzzwords.",
    strengths: [
      "Fluent conversational English",
      "Basic syntax mastery in Python"
    ],
    weaknesses: [
      "Inaccurate resume claims (flagged during technical deep-dive)",
      "High bluffing tendency and evasive responses when probed",
      "Deflected accountability for past system outages"
    ],
    roadmap: {
      d30: "Candidate disqualified from hiring pipeline.",
      d60: "N/A",
      d90: "N/A"
    },
    action: "Disqualify immediately due to integrity and depth discrepancies.",
    stage1Answers: [
      { id: 1, topic: "Logical Deduction", question: "If all Zips are Zaps and no Zaps are Zops, are some Zips Zops?", candidateAnswer: "No, impossible", correctAnswer: "No, impossible for any Zip to be a Zop", isRight: true, timeTaken: "28s", explanation: "Correct." },
      { id: 2, topic: "Quantitative Logic", question: "Work completion rate: A takes 6h, B takes 8h. Together with C they take 2.4h. Find C's alone time.", candidateAnswer: "7.2 hours", correctAnswer: "8.0 hours", isRight: false, timeTaken: "75s", explanation: "Arithmetic miscalculation on inverse sums." },
      { id: 3, topic: "Pattern Recognition", question: "Identify next term in sequence: 3, 7, 15, 31, 63, ?", candidateAnswer: "127", correctAnswer: "127", isRight: true, timeTaken: "18s", explanation: "Correct." },
      { id: 4, topic: "Data Interpretation", question: "Calculate net quarterly growth margin from 4-node revenue graph with amortized depreciation.", candidateAnswer: "16.50%", correctAnswer: "14.25%", isRight: false, timeTaken: "85s", explanation: "Ignored depreciation deduction." },
      { id: 5, topic: "Bitwise Reasoning", question: "Given x ^ y = 0, what is the fundamental mathematical relationship between x and y?", candidateAnswer: "x == y", correctAnswer: "x == y", isRight: true, timeTaken: "14s", explanation: "Correct." },
      { id: 6, topic: "Probability", question: "Probability of picking at least one defective chip in 3 draws without replacement from 20 (with 4 defective).", candidateAnswer: "60.00%", correctAnswer: "49.12%", isRight: false, timeTaken: "68s", explanation: "Used replacement probability without decrementing denominator." },
      { id: 7, topic: "Syllogism & Sets", question: "Venn intersection: (A ∪ B) ∩ (A ∪ C) equivalence in set boolean algebra.", candidateAnswer: "A ∪ (B ∩ C)", correctAnswer: "A ∪ (B ∩ C)", isRight: true, timeTaken: "32s", explanation: "Correct." },
      { id: 8, topic: "Critical Reasoning", question: "Identify the flawed assumption in company's employee retention versus salary claim.", candidateAnswer: "Assumes correlation implies causation", correctAnswer: "Assumes correlation implies sole causation", isRight: true, timeTaken: "44s", explanation: "Correct." },
      { id: 9, topic: "Time & Distance", question: "Two trains moving towards each other at 60 km/h and 90 km/h separated by 300 km. Collision countdown?", candidateAnswer: "2.0 hours", correctAnswer: "2.0 hours", isRight: true, timeTaken: "25s", explanation: "Correct." },
      { id: 10, topic: "Combinatorics", question: "Number of unique 4-character permutations with at least one special symbol from set of 10 alphanumerics and 3 symbols.", candidateAnswer: "18,561 combinations", correctAnswer: "18,561 combinations", isRight: true, timeTaken: "90s", explanation: "Correct after prolonged scratchpad effort." },
      { id: 11, topic: "Algorithmic Tracing", question: "State complexity class of finding median in two sorted arrays of size m and n.", candidateAnswer: "O(m + n) merge scan", correctAnswer: "O(log(min(m, n)))", isRight: false, timeTaken: "35s", explanation: "Did not know sub-linear partition algorithm." },
      { id: 12, topic: "Spatial Reasoning", question: "3D cube rotation with colored opposite faces after 3 compound axial rotations.", candidateAnswer: "Yellow face on Top, Blue on Right", correctAnswer: "Yellow face on Top, Blue on Right", isRight: true, timeTaken: "40s", explanation: "Correct." },
      { id: 13, topic: "Modulo Arithmetic", question: "Find remainder when 7^100 is divided by 10.", candidateAnswer: "1", correctAnswer: "1", isRight: true, timeTaken: "28s", explanation: "Correct." },
      { id: 14, topic: "Financial Reasoning", question: "Compound interest vs simple interest difference over 2 years at 10% on $10,000 principal.", candidateAnswer: "$100", correctAnswer: "$100", isRight: true, timeTaken: "22s", explanation: "Correct." },
      { id: 15, topic: "Matrix Transformation", question: "Determinant of 3x3 upper triangular matrix with diagonal elements 2, 5, 8.", candidateAnswer: "80", correctAnswer: "80", isRight: true, timeTaken: "15s", explanation: "Correct." },
      { id: 16, topic: "Game Theory Logic", question: "Nim game optimal first move with heaps (3, 4, 5).", candidateAnswer: "Remove 2 from heap 4", correctAnswer: "Reduce heap 5 to 3", isRight: false, timeTaken: "80s", explanation: "Incorrect XOR nim-sum calculation." },
      { id: 17, topic: "Network Flow Logic", question: "Max flow min cut theorem: capacity of cut (S, T) given saturated edge weights.", candidateAnswer: "28 units", correctAnswer: "28 units", isRight: true, timeTaken: "52s", explanation: "Correct." },
      { id: 18, topic: "Deductive Grid", question: "Logic puzzle: 5 developers with different IDEs, languages, and coffee preferences. Who codes Rust?", candidateAnswer: "Developer in Office #4", correctAnswer: "Developer in Office #4", isRight: true, timeTaken: "95s", explanation: "Correct." },
      { id: 19, topic: "Graph Theory", question: "Minimum number of colors needed to color vertices of planar graph with no adjacent same colors.", candidateAnswer: "4", correctAnswer: "4", isRight: true, timeTaken: "18s", explanation: "Correct." },
      { id: 20, topic: "Statistical Inference", question: "Interpretation of p-value < 0.01 in A/B latency benchmark.", candidateAnswer: "Reject null hypothesis at 99% confidence", correctAnswer: "Reject null hypothesis at 99% confidence", isRight: true, timeTaken: "34s", explanation: "Correct." },
      { id: 21, topic: "Clock Angle Puzzle", question: "Angle between hour and minute hand at exactly 3:15.", candidateAnswer: "7.5 degrees", correctAnswer: "7.5 degrees", isRight: true, timeTaken: "24s", explanation: "Correct." },
      { id: 22, topic: "Recursive Relation", question: "Solve recurrence T(n) = 2T(n/2) + O(n).", candidateAnswer: "O(n^2)", correctAnswer: "O(n log n)", isRight: false, timeTaken: "20s", explanation: "Incorrectly assumed exponential branching overhead." },
      { id: 23, topic: "Conditional Probability", question: "Monty Hall problem: probability of winning car if contestant switches door.", candidateAnswer: "2/3", correctAnswer: "2/3", isRight: true, timeTaken: "19s", explanation: "Correct." },
      { id: 24, topic: "Cryptarithmetic", question: "Solve SEND + MORE = MONEY for letter 'M' and 'O'.", candidateAnswer: "M = 1, O = 0", correctAnswer: "M = 1, O = 0", isRight: true, timeTaken: "50s", explanation: "Correct." },
      { id: 25, topic: "Data Sufficiency", question: "Is integer N divisible by 6? Statement 1: N divisible by 3. Statement 2: N is even.", candidateAnswer: "Both statements TOGETHER are sufficient", correctAnswer: "Both statements TOGETHER are sufficient", isRight: true, timeTaken: "30s", explanation: "Correct." }
    ],
    stage2Problems: [
      { id: 1, title: "High-Throughput LRU Cache with TTL Eviction", topic: "Data Structures & Concurrency", targetComplexity: "O(1) Get/Put", complexity: "O(n) Linear Scan", passedTestCases: "6/12", isRight: false, keyEdgeCase: "Memory leak on expired keys; linear search on get()", notes: "Used Python array with pop(0) resulting in O(n) evictions." },
      { id: 2, title: "Distributed Rate Limiter (Token Bucket)", topic: "System Logic & Algorithms", targetComplexity: "O(1) Token Refill", complexity: "O(n) Inefficient", passedTestCases: "4/10", isRight: false, keyEdgeCase: "Complete deadlock under concurrent load simulation", notes: "Hardcoded sleep() intervals; failed 6 concurrency test cases." },
      { id: 3, title: "Sliding Window Maximum over Stream", topic: "Algorithmic Efficiency", targetComplexity: "O(n) Time, O(k) Space", complexity: "O(n²) Brute Force", passedTestCases: "10/15", isRight: false, keyEdgeCase: "Timed out on 100k element stream inputs", notes: "Nested loop re-computing max for every sliding sub-array." },
      { id: 4, title: "Graph Cycle Detection in Microservice Dependency DAG", topic: "Graph Algorithms", targetComplexity: "O(V + E)", complexity: "O(V + E) Working", passedTestCases: "8/8", isRight: true, keyEdgeCase: "Basic cyclic check passed", notes: "Working BFS approach, though variable naming was ambiguous." },
      { id: 5, title: "Binary Search Tree Validation & Range Query", topic: "Trees & Recursion", targetComplexity: "O(n) Time, O(h) Space", complexity: "O(n) Working", passedTestCases: "10/10", isRight: true, keyEdgeCase: "Standard recursion with inorder check", notes: "Passed basic tree validation tests." }
    ]
  },
  {
    id: 3,
    name: "Rohan Deshmukh",
    role: "Full-Stack Developer",
    avatar: "RD",
    verdict: "Reject",
    verdictClass: "badge-danger",
    aptitudeScore: 58,
    codingScore: 2.2,
    interviewScore: 2.8,
    complexity: "O(n³) Inefficient",
    bluffingRisk: "Zero Risk",
    bluffingClass: "badge-success",
    speechMetrics: { wpm: 110, fillers: "6.1/min", hesitation: "2.8s", confidence: "60%" },
    debriefScript: "Executive debrief for Rohan Deshmukh. Candidate fell below minimum problem solving aptitude threshold with inefficient cubic coding complexity. While candidate was polite and honest, foundational technical readiness is not yet at baseline. Recommendation: Send polite rejection with guidance to reapply in six months.",
    metrics: {
      problemSolving: 58,
      codingEfficiency: 44,
      systemDesign: 52,
      communication: 56,
      authenticity: 85
    },
    aptitudeNotes: "Failed accuracy threshold (58%). Multiple calculation errors on standard logical reasoning sections. 14 Correct, 11 Incorrect out of 25 questions.",
    codingNotes: "Nested loops resulting in cubic O(n^3) complexity on a sliding window challenge. Unhandled boundary and null checks. 2 of 5 Test Suites passed.",
    interviewNotes: "Honest demeanor with no intention to mislead, but demonstrated shallow understanding of React lifecycle and SQL indexes.",
    strengths: [
      "Respectful and polite demeanor",
      "Transparent about knowledge limits"
    ],
    weaknesses: [
      "Sub-threshold problem-solving speed & accuracy",
      "Inefficient coding algorithms and unhandled edge cases"
    ],
    roadmap: {
      d30: "Recommend completing Data Structures & Algorithms curriculum.",
      d60: "Practice LeetCode medium questions and concurrency patterns.",
      d90: "Eligible for re-screening after 6 months."
    },
    action: "Send polite rejection notice with recommendations for DSA upskilling.",
    stage1Answers: [
      { id: 1, topic: "Logical Deduction", question: "If all Zips are Zaps and no Zaps are Zops, are some Zips Zops?", candidateAnswer: "Yes, some might be", correctAnswer: "No, impossible for any Zip to be a Zop", isRight: false, timeTaken: "40s", explanation: "Misunderstood categorical syllogism." },
      { id: 2, topic: "Quantitative Logic", question: "Work completion rate: A takes 6h, B takes 8h. Together with C they take 2.4h. Find C's alone time.", candidateAnswer: "10.0 hours", correctAnswer: "8.0 hours", isRight: false, timeTaken: "88s", explanation: "Arithmetic errors in reciprocal fraction calculation." },
      { id: 3, topic: "Pattern Recognition", question: "Identify next term in sequence: 3, 7, 15, 31, 63, ?", candidateAnswer: "127", correctAnswer: "127", isRight: true, timeTaken: "28s", explanation: "Correct." },
      { id: 4, topic: "Data Interpretation", question: "Calculate net quarterly growth margin from 4-node revenue graph with amortized depreciation.", candidateAnswer: "18.00%", correctAnswer: "14.25%", isRight: false, timeTaken: "90s", explanation: "Misread graph axis scale." },
      { id: 5, topic: "Bitwise Reasoning", question: "Given x ^ y = 0, what is the fundamental mathematical relationship between x and y?", candidateAnswer: "x == y", correctAnswer: "x == y", isRight: true, timeTaken: "20s", explanation: "Correct." },
      { id: 6, topic: "Probability", question: "Probability of picking at least one defective chip in 3 draws without replacement from 20 (with 4 defective).", candidateAnswer: "20.00%", correctAnswer: "49.12%", isRight: false, timeTaken: "75s", explanation: "Confused single-draw probability with 3 draws." },
      { id: 7, topic: "Syllogism & Sets", question: "Venn intersection: (A ∪ B) ∩ (A ∪ C) equivalence in set boolean algebra.", candidateAnswer: "A ∩ B ∩ C", correctAnswer: "A ∪ (B ∩ C)", isRight: false, timeTaken: "55s", explanation: "Distributive law missed." },
      { id: 8, topic: "Critical Reasoning", question: "Identify the flawed assumption in company's employee retention versus salary claim.", candidateAnswer: "Assumes correlation implies causation", correctAnswer: "Assumes correlation implies sole causation", isRight: true, timeTaken: "50s", explanation: "Correct." },
      { id: 9, topic: "Time & Distance", question: "Two trains moving towards each other at 60 km/h and 90 km/h separated by 300 km. Collision countdown?", candidateAnswer: "2.0 hours", correctAnswer: "2.0 hours", isRight: true, timeTaken: "34s", explanation: "Correct." },
      { id: 10, topic: "Combinatorics", question: "Number of unique 4-character permutations with at least one special symbol from set of 10 alphanumerics and 3 symbols.", candidateAnswer: "5,000 combinations", correctAnswer: "18,561 combinations", isRight: false, timeTaken: "110s", explanation: "Gross underestimation; missed permutations." },
      { id: 11, topic: "Algorithmic Tracing", question: "State complexity class of finding median in two sorted arrays of size m and n.", candidateAnswer: "O(n^2)", correctAnswer: "O(log(min(m, n)))", isRight: false, timeTaken: "45s", explanation: "Guessed quadratic complexity." },
      { id: 12, topic: "Spatial Reasoning", question: "3D cube rotation with colored opposite faces after 3 compound axial rotations.", candidateAnswer: "Yellow face on Top, Blue on Right", correctAnswer: "Yellow face on Top, Blue on Right", isRight: true, timeTaken: "52s", explanation: "Correct." },
      { id: 13, topic: "Modulo Arithmetic", question: "Find remainder when 7^100 is divided by 10.", candidateAnswer: "7", correctAnswer: "1", isRight: false, timeTaken: "40s", explanation: "Did not compute modular exponent period." },
      { id: 14, topic: "Financial Reasoning", question: "Compound interest vs simple interest difference over 2 years at 10% on $10,000 principal.", candidateAnswer: "$100", correctAnswer: "$100", isRight: true, timeTaken: "35s", explanation: "Correct." },
      { id: 15, topic: "Matrix Transformation", question: "Determinant of 3x3 upper triangular matrix with diagonal elements 2, 5, 8.", candidateAnswer: "15", correctAnswer: "80", isRight: false, timeTaken: "30s", explanation: "Added diagonals (2+5+8) instead of multiplying." },
      { id: 16, topic: "Game Theory Logic", question: "Nim game optimal first move with heaps (3, 4, 5).", candidateAnswer: "Take all from heap 5", correctAnswer: "Reduce heap 5 to 3", isRight: false, timeTaken: "90s", explanation: "Incorrect strategy." },
      { id: 17, topic: "Network Flow Logic", question: "Max flow min cut theorem: capacity of cut (S, T) given saturated edge weights.", candidateAnswer: "28 units", correctAnswer: "28 units", isRight: true, timeTaken: "65s", explanation: "Correct." },
      { id: 18, topic: "Deductive Grid", question: "Logic puzzle: 5 developers with different IDEs, languages, and coffee preferences. Who codes Rust?", candidateAnswer: "Developer in Office #4", correctAnswer: "Developer in Office #4", isRight: true, timeTaken: "120s", explanation: "Correct." },
      { id: 19, topic: "Graph Theory", question: "Minimum number of colors needed to color vertices of planar graph with no adjacent same colors.", candidateAnswer: "4", correctAnswer: "4", isRight: true, timeTaken: "25s", explanation: "Correct." },
      { id: 20, topic: "Statistical Inference", question: "Interpretation of p-value < 0.01 in A/B latency benchmark.", candidateAnswer: "Reject null hypothesis at 99% confidence", correctAnswer: "Reject null hypothesis at 99% confidence", isRight: true, timeTaken: "42s", explanation: "Correct." },
      { id: 21, topic: "Clock Angle Puzzle", question: "Angle between hour and minute hand at exactly 3:15.", candidateAnswer: "0 degrees", correctAnswer: "7.5 degrees", isRight: false, timeTaken: "26s", explanation: "Overlooked hour hand progress." },
      { id: 22, topic: "Recursive Relation", question: "Solve recurrence T(n) = 2T(n/2) + O(n).", candidateAnswer: "O(n log n)", correctAnswer: "O(n log n)", isRight: true, timeTaken: "30s", explanation: "Correct." },
      { id: 23, topic: "Conditional Probability", question: "Monty Hall problem: probability of winning car if contestant switches door.", candidateAnswer: "1/2 (50%)", correctAnswer: "2/3", isRight: false, timeTaken: "32s", explanation: "Fell for common 50/50 misconception." },
      { id: 24, topic: "Cryptarithmetic", question: "Solve SEND + MORE = MONEY for letter 'M' and 'O'.", candidateAnswer: "M = 1, O = 0", correctAnswer: "M = 1, O = 0", isRight: true, timeTaken: "70s", explanation: "Correct." },
      { id: 25, topic: "Data Sufficiency", question: "Is integer N divisible by 6? Statement 1: N divisible by 3. Statement 2: N is even.", candidateAnswer: "Both statements TOGETHER are sufficient", correctAnswer: "Both statements TOGETHER are sufficient", isRight: true, timeTaken: "45s", explanation: "Correct." }
    ],
    stage2Problems: [
      { id: 1, title: "High-Throughput LRU Cache with TTL Eviction", topic: "Data Structures & Concurrency", targetComplexity: "O(1) Get/Put", complexity: "O(n) Failed", passedTestCases: "3/12", isRight: false, keyEdgeCase: "Uncaught NullPointerException on empty list removal", notes: "Did not implement doubly linked list nodes; crashed on boundary." },
      { id: 2, title: "Distributed Rate Limiter (Token Bucket)", topic: "System Logic & Algorithms", targetComplexity: "O(1) Token Refill", complexity: "Failed", passedTestCases: "1/10", isRight: false, keyEdgeCase: "Infinite loop on negative burst parameter", notes: "Did not finish implementation within allocated round time." },
      { id: 3, title: "Sliding Window Maximum over Stream", topic: "Algorithmic Efficiency", targetComplexity: "O(n) Time, O(k) Space", complexity: "O(n³) Inefficient", passedTestCases: "5/15", isRight: false, keyEdgeCase: "Severe timeout on k > 500", notes: "Three nested while loops re-slicing strings." },
      { id: 4, title: "Graph Cycle Detection in Microservice Dependency DAG", topic: "Graph Algorithms", targetComplexity: "O(V + E)", complexity: "O(V + E) Working", passedTestCases: "8/8", isRight: true, keyEdgeCase: "Basic adjacency list BFS", notes: "Working BFS cycle check." },
      { id: 5, title: "String Anagram & Palindrome Validator", topic: "Strings & HashMaps", targetComplexity: "O(n) Time, O(1) Space", complexity: "O(n) Working", passedTestCases: "10/10", isRight: true, keyEdgeCase: "Standard character frequency counting", notes: "Clean implementation using hash table." }
    ]
  },
  {
    id: 4,
    name: "Sneha Kulkarni",
    role: "Technical Solutions / Product Engineer",
    avatar: "SK",
    verdict: "Role Pivot",
    verdictClass: "badge-warning",
    aptitudeScore: 88,
    codingScore: 3.4,
    interviewScore: 4.9,
    complexity: "O(n log n) Clean",
    bluffingRisk: "Zero Risk",
    bluffingClass: "badge-success",
    speechMetrics: { wpm: 135, fillers: "1.8/min", hesitation: "0.8s", confidence: "98%" },
    debriefScript: "Executive debrief for Sneha Kulkarni. Outstanding executive presence, high aptitude, and exceptional stakeholder communication. Demonstrates natural talent for bridging business requirements with clean API engineering. Recommendation: Pivot candidate to Lead Technical Solutions or Product Engineering.",
    metrics: {
      problemSolving: 88,
      codingEfficiency: 70,
      systemDesign: 88,
      communication: 98,
      authenticity: 96
    },
    aptitudeNotes: "Exceptional at translating ambiguous business constraints into structured analytical steps. 22 Correct, 3 Incorrect out of 25 questions.",
    codingNotes: "Clean, readable, modular API design with comprehensive docstrings, though DSA algorithmic speed was moderate. 4 of 5 Test Suites passed.",
    interviewNotes: "Superb executive presence and empathy. Masterfully demonstrated system trade-offs and cross-team requirements.",
    strengths: [
      "World-class stakeholder communication and leadership",
      "Clear API architecture and rapid product prototyping",
      "Zero bluffing; grounded in realistic software ergonomics"
    ],
    weaknesses: [
      "Moderate low-level algorithmic optimization speed"
    ],
    roadmap: {
      d30: "Lead customer architectural discovery workshops and API onboarding.",
      d60: "Author technical product requirement blueprints for core dev teams.",
      d90: "Own enterprise partner integrations and technical solution architecture."
    },
    action: "Pivot candidate to Lead Technical Solutions Engineer or Product Eng.",
    stage1Answers: [
      { id: 1, topic: "Logical Deduction", question: "If all Zips are Zaps and no Zaps are Zops, are some Zips Zops?", candidateAnswer: "No, impossible for any Zip to be a Zop", correctAnswer: "No, impossible for any Zip to be a Zop", isRight: true, timeTaken: "20s", explanation: "Correct." },
      { id: 2, topic: "Quantitative Logic", question: "Work completion rate: A takes 6h, B takes 8h. Together with C they take 2.4h. Find C's alone time.", candidateAnswer: "8.0 hours", correctAnswer: "8.0 hours", isRight: true, timeTaken: "38s", explanation: "Correct." },
      { id: 3, topic: "Pattern Recognition", question: "Identify next term in sequence: 3, 7, 15, 31, 63, ?", candidateAnswer: "127", correctAnswer: "127", isRight: true, timeTaken: "14s", explanation: "Correct." },
      { id: 4, topic: "Data Interpretation", question: "Calculate net quarterly growth margin from 4-node revenue graph with amortized depreciation.", candidateAnswer: "14.25%", correctAnswer: "14.25%", isRight: true, timeTaken: "48s", explanation: "Correct." },
      { id: 5, topic: "Bitwise Reasoning", question: "Given x ^ y = 0, what is the fundamental mathematical relationship between x and y?", candidateAnswer: "x == y", correctAnswer: "x == y", isRight: true, timeTaken: "10s", explanation: "Correct." },
      { id: 6, topic: "Probability", question: "Probability of picking at least one defective chip in 3 draws without replacement from 20 (with 4 defective).", candidateAnswer: "49.12%", correctAnswer: "49.12%", isRight: true, timeTaken: "55s", explanation: "Correct." },
      { id: 7, topic: "Syllogism & Sets", question: "Venn intersection: (A ∪ B) ∩ (A ∪ C) equivalence in set boolean algebra.", candidateAnswer: "A ∪ (B ∩ C)", correctAnswer: "A ∪ (B ∩ C)", isRight: true, timeTaken: "28s", explanation: "Correct." },
      { id: 8, topic: "Critical Reasoning", question: "Identify the flawed assumption in company's employee retention versus salary claim.", candidateAnswer: "Assumes correlation implies sole causation", correctAnswer: "Assumes correlation implies sole causation", isRight: true, timeTaken: "30s", explanation: "Sharp critical deduction." },
      { id: 9, topic: "Time & Distance", question: "Two trains moving towards each other at 60 km/h and 90 km/h separated by 300 km. Collision countdown?", candidateAnswer: "2.0 hours", correctAnswer: "2.0 hours", isRight: true, timeTaken: "18s", explanation: "Correct." },
      { id: 10, topic: "Combinatorics", question: "Number of unique 4-character permutations with at least one special symbol from set of 10 alphanumerics and 3 symbols.", candidateAnswer: "18,561 combinations", correctAnswer: "18,561 combinations", isRight: true, timeTaken: "68s", explanation: "Correct." },
      { id: 11, topic: "Algorithmic Tracing", question: "State complexity class of finding median in two sorted arrays of size m and n.", candidateAnswer: "O(log(min(m, n)))", correctAnswer: "O(log(min(m, n)))", isRight: true, timeTaken: "26s", explanation: "Correct." },
      { id: 12, topic: "Spatial Reasoning", question: "3D cube rotation with colored opposite faces after 3 compound axial rotations.", candidateAnswer: "Yellow face on Top, Blue on Right", correctAnswer: "Yellow face on Top, Blue on Right", isRight: true, timeTaken: "34s", explanation: "Correct." },
      { id: 13, topic: "Modulo Arithmetic", question: "Find remainder when 7^100 is divided by 10.", candidateAnswer: "1", correctAnswer: "1", isRight: true, timeTaken: "22s", explanation: "Correct." },
      { id: 14, topic: "Financial Reasoning", question: "Compound interest vs simple interest difference over 2 years at 10% on $10,000 principal.", candidateAnswer: "$100", correctAnswer: "$100", isRight: true, timeTaken: "16s", explanation: "Correct." },
      { id: 15, topic: "Matrix Transformation", question: "Determinant of 3x3 upper triangular matrix with diagonal elements 2, 5, 8.", candidateAnswer: "80", correctAnswer: "80", isRight: true, timeTaken: "12s", explanation: "Correct." },
      { id: 16, topic: "Game Theory Logic", question: "Nim game optimal first move with heaps (3, 4, 5).", candidateAnswer: "Take 1 from heap 3", correctAnswer: "Reduce heap 5 to 3", isRight: false, timeTaken: "60s", explanation: "Slight miscalculation in binary sum balance." },
      { id: 17, topic: "Network Flow Logic", question: "Max flow min cut theorem: capacity of cut (S, T) given saturated edge weights.", candidateAnswer: "28 units", correctAnswer: "28 units", isRight: true, timeTaken: "46s", explanation: "Correct." },
      { id: 18, topic: "Deductive Grid", question: "Logic puzzle: 5 developers with different IDEs, languages, and coffee preferences. Who codes Rust?", candidateAnswer: "Developer in Office #4", correctAnswer: "Developer in Office #4", isRight: true, timeTaken: "74s", explanation: "Correct." },
      { id: 19, topic: "Graph Theory", question: "Minimum number of colors needed to color vertices of planar graph with no adjacent same colors.", candidateAnswer: "4", correctAnswer: "4", isRight: true, timeTaken: "14s", explanation: "Correct." },
      { id: 20, topic: "Statistical Inference", question: "Interpretation of p-value < 0.01 in A/B latency benchmark.", candidateAnswer: "Reject null hypothesis at 99% confidence", correctAnswer: "Reject null hypothesis at 99% confidence", isRight: true, timeTaken: "24s", explanation: "Correct." },
      { id: 21, topic: "Clock Angle Puzzle", question: "Angle between hour and minute hand at exactly 3:15.", candidateAnswer: "7.5 degrees", correctAnswer: "7.5 degrees", isRight: true, timeTaken: "20s", explanation: "Correct." },
      { id: 22, topic: "Recursive Relation", question: "Solve recurrence T(n) = 2T(n/2) + O(n).", candidateAnswer: "O(n log n)", correctAnswer: "O(n log n)", isRight: true, timeTaken: "16s", explanation: "Correct." },
      { id: 23, topic: "Conditional Probability", question: "Monty Hall problem: probability of winning car if contestant switches door.", candidateAnswer: "2/3", correctAnswer: "2/3", isRight: true, timeTaken: "15s", explanation: "Correct." },
      { id: 24, topic: "Cryptarithmetic", question: "Solve SEND + MORE = MONEY for letter 'M' and 'O'.", candidateAnswer: "M = 2, O = 1", correctAnswer: "M = 1, O = 0", isRight: false, timeTaken: "55s", explanation: "Over-calculated carry bit addition." },
      { id: 25, topic: "Data Sufficiency", question: "Is integer N divisible by 6? Statement 1: N divisible by 3. Statement 2: N is even.", candidateAnswer: "Statement 1 alone is sufficient", correctAnswer: "Both statements TOGETHER are sufficient", isRight: false, timeTaken: "25s", explanation: "Rushed through data sufficiency question." }
    ],
    stage2Problems: [
      { id: 1, title: "High-Throughput LRU Cache with TTL Eviction", topic: "Data Structures & Concurrency", targetComplexity: "O(1) Get/Put", complexity: "O(1) Clean", passedTestCases: "12/12", isRight: true, keyEdgeCase: "Clear modular architecture and readable documentation", notes: "Exemplary API contracts and unit test structure." },
      { id: 2, title: "Distributed Rate Limiter (Token Bucket)", topic: "System Logic & Algorithms", targetComplexity: "O(1) Token Refill", complexity: "O(n log n) Moderate", passedTestCases: "8/10", isRight: false, keyEdgeCase: "Edge case in microsecond-level clock sync", notes: "Functional prototype; slight latency overhead." },
      { id: 3, title: "Sliding Window Maximum over Stream", topic: "Algorithmic Efficiency", targetComplexity: "O(n) Time, O(k) Space", complexity: "O(n log n) Clean", passedTestCases: "15/15", isRight: true, keyEdgeCase: "Clean Heap-based window tracker", notes: "Very readable, production-grade documentation." },
      { id: 4, title: "Graph Cycle Detection in Microservice Dependency DAG", topic: "Graph Algorithms", targetComplexity: "O(V + E)", complexity: "O(V + E) Optimal", passedTestCases: "8/8", isRight: true, keyEdgeCase: "Clear recursion termination", notes: "Passed all topological test cases." },
      { id: 5, title: "REST API Endpoint & Webhook Dispatcher", topic: "System Design & Web APIs", targetComplexity: "O(1) Dispatch", complexity: "O(1) Optimal", passedTestCases: "10/10", isRight: true, keyEdgeCase: "Exponential backoff retry with jitter", notes: "Exceptional error handling and webhook ergonomics." }
    ]
  }
];

// Recalculate candidate stats dynamically from recorded Right/Wrong answers
function recalculateCandidateStats(cand) {
  if (cand.stage1Answers && cand.stage1Answers.length > 0) {
    const right1 = cand.stage1Answers.filter(a => a.isRight).length;
    const total1 = cand.stage1Answers.length;
    cand.aptitudeScore = Math.round((right1 / total1) * 100);
    cand.metrics.problemSolving = cand.aptitudeScore;
    cand.aptitudeNotes = `${right1 >= 22 ? 'Top percentile.' : (right1 >= 18 ? 'Solid aptitude.' : 'Sub-threshold.')} ${right1} Correct, ${total1 - right1} Incorrect out of ${total1} questions.`;
  }

  if (cand.stage2Problems && cand.stage2Problems.length > 0) {
    const right2 = cand.stage2Problems.filter(p => p.isRight).length;
    const total2 = cand.stage2Problems.length;
    cand.codingScore = parseFloat(((right2 / total2) * 5.0).toFixed(1));
    cand.metrics.codingEfficiency = Math.round(cand.codingScore * 20);
    cand.codingNotes = `${right2} of ${total2} Coding Test Suites passed. ${cand.complexity}.`;
  }
}

// --- Render Candidates Cards ---
function renderCandidates(list) {
  const grid = document.getElementById("candidatesGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (list.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No candidates matched your filter criteria.</div>`;
    return;
  }

  list.forEach(c => {
    // Count right/wrong
    const s1Right = c.stage1Answers ? c.stage1Answers.filter(a => a.isRight).length : 0;
    const s1Wrong = c.stage1Answers ? c.stage1Answers.length - s1Right : 0;
    const s2Right = c.stage2Problems ? c.stage2Problems.filter(p => p.isRight).length : 0;
    const s2Wrong = c.stage2Problems ? c.stage2Problems.length - s2Right : 0;

    const card = document.createElement("div");
    card.className = "candidate-card";
    card.innerHTML = `
      <div class="candidate-top">
        <div class="candidate-avatar-name">
          <div class="avatar">${c.avatar}</div>
          <div>
            <h3 class="candidate-name">${c.name}</h3>
            <p class="candidate-role">${c.role}</p>
          </div>
        </div>
        <span class="badge ${c.verdictClass}">${c.verdict}</span>
      </div>

      <div class="candidate-metrics">
        <div class="metric-item">
          <span class="metric-title">Stage 1: Aptitude</span>
          <span class="metric-value-box">${c.aptitudeScore}%</span>
          <div class="right-wrong-chip">
            <span class="rw-tag rw-right" title="Correct Answers">✅ ${s1Right}</span>
            <span class="rw-tag rw-wrong" title="Incorrect Answers">❌ ${s1Wrong}</span>
          </div>
        </div>
        <div class="metric-item">
          <span class="metric-title">Stage 2: Coding</span>
          <span class="metric-value-box">${c.codingScore} <small style="font-size:0.7rem; color:var(--text-muted)">/5</small></span>
          <div class="right-wrong-chip">
            <span class="rw-tag rw-right" title="Test Suites Passed">✅ ${s2Right}</span>
            <span class="rw-tag rw-wrong" title="Test Suites Failed">❌ ${s2Wrong}</span>
          </div>
        </div>
        <div class="metric-item">
          <span class="metric-title">Stage 3: Interview</span>
          <span class="metric-value-box">${c.interviewScore} <small style="font-size:0.7rem; color:var(--text-muted)">/5</small></span>
          <span class="metric-tag">${c.interviewScore >= 4.0 ? 'Top Tier' : 'Standard'}</span>
        </div>
      </div>

      <div class="integrity-flag-row">
        <span>AI Veracity & Bluffing Check:</span>
        <span class="badge ${c.bluffingClass}">${c.bluffingRisk}</span>
      </div>

      <div class="card-actions" style="display: flex; gap: 8px;">
        <button class="btn btn-outline" style="flex: 1; font-size: 0.8rem; padding: 8px 10px;" onclick="openCandidateModal(${c.id})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          Dossier
        </button>
        <button class="btn btn-primary" style="flex: 1; font-size: 0.8rem; padding: 8px 10px;" onclick="focusAnswerRecorderForCandidate(${c.id})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          Answers (✅/❌)
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// --- Filter Handling ---
function applyFilters() {
  const searchInput = document.getElementById("candidateSearch");
  const decisionSelect = document.getElementById("decisionFilter");
  const bluffSelect = document.getElementById("bluffFilter");

  const search = searchInput ? searchInput.value.toLowerCase() : "";
  const decision = decisionSelect ? decisionSelect.value : "all";
  const bluff = bluffSelect ? bluffSelect.value : "all";

  const filtered = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search) || c.role.toLowerCase().includes(search);
    const matchesDecision = decision === "all" || c.verdict === decision;
    const matchesBluff = bluff === "all" || c.bluffingRisk === bluff;
    return matchesSearch && matchesDecision && matchesBluff;
  });

  renderCandidates(filtered);
}

// --- Modal Handling with Full Answer Sheet Tabs ---
let activeModalTab = "overview";

function openCandidateModal(id, defaultTab = "overview") {
  const c = candidates.find(item => item.id === id);
  if (!c) return;

  document.getElementById("modalCandidateName").textContent = c.name;
  document.getElementById("modalCandidateRole").textContent = c.role;
  const verdictBadge = document.getElementById("modalVerdictBadge");
  verdictBadge.className = `badge ${c.verdictClass}`;
  verdictBadge.textContent = c.verdict;

  activeModalTab = defaultTab;
  renderModalBody(c);
  document.getElementById("candidateModal").classList.add("active");
}

function renderModalBody(c) {
  const body = document.getElementById("modalBodyContent");
  if (!body) return;

  const s1Right = c.stage1Answers ? c.stage1Answers.filter(a => a.isRight).length : 0;
  const s1Total = c.stage1Answers ? c.stage1Answers.length : 0;
  const s2Right = c.stage2Problems ? c.stage2Problems.filter(p => p.isRight).length : 0;
  const s2Total = c.stage2Problems ? c.stage2Problems.length : 0;

  body.innerHTML = `
    <!-- Modal Navigation Tabs -->
    <div class="modal-nav-tabs">
      <button class="modal-tab ${activeModalTab === 'overview' ? 'active' : ''}" onclick="switchModalTab(${c.id}, 'overview')">
        📋 Overview & Roadmap
      </button>
      <button class="modal-tab ${activeModalTab === 'stage1' ? 'active' : ''}" onclick="switchModalTab(${c.id}, 'stage1')">
        🧠 Stage 1 Answers (${s1Right}/${s1Total} Right)
      </button>
      <button class="modal-tab ${activeModalTab === 'stage2' ? 'active' : ''}" onclick="switchModalTab(${c.id}, 'stage2')">
        💻 Stage 2 Coding (${s2Right}/${s2Total} Passed)
      </button>
    </div>

    <div class="modal-tab-content" id="modalTabContent">
      ${activeModalTab === 'overview' ? renderModalOverviewTab(c, s1Right, s1Total, s2Right, s2Total) : (activeModalTab === 'stage1' ? renderModalStage1Tab(c) : renderModalStage2Tab(c))}
    </div>
  `;
}

function switchModalTab(candidateId, tabName) {
  activeModalTab = tabName;
  const c = candidates.find(item => item.id === candidateId);
  if (c) renderModalBody(c);
}

function renderModalOverviewTab(c, s1Right, s1Total, s2Right, s2Total) {
  return `
    <div class="modal-section">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:8px;">
        <h4 class="modal-section-title" style="margin-bottom:0;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          Stage 1: Aptitude & Problem Solving (${c.aptitudeScore}%)
        </h4>
        <span class="badge ${c.aptitudeScore >= 75 ? 'badge-success' : 'badge-danger'}">
          ${s1Right} Right / ${s1Total - s1Right} Wrong
        </span>
      </div>
      <p>${c.aptitudeNotes}</p>
    </div>

    <div class="modal-section">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:8px;">
        <h4 class="modal-section-title" style="margin-bottom:0;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
          Stage 2: Coding Proficiency & Big-O Efficiency (${c.codingScore} / 5.0 — ${c.complexity})
        </h4>
        <span class="badge ${c.codingScore >= 3.5 ? 'badge-success' : 'badge-danger'}">
          ${s2Right} Passed / ${s2Total - s2Right} Failed
        </span>
      </div>
      <p>${c.codingNotes}</p>
    </div>

    <div class="modal-section">
      <h4 class="modal-section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        Stage 3: Interview, Resume Integrity & Bluffing Review (${c.interviewScore} / 5.0)
      </h4>
      <p>${c.interviewNotes}</p>
      <div style="margin-top: 10px; display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
        <div><strong>Integrity Status:</strong> <span class="badge ${c.bluffingClass}">${c.bluffingRisk}</span></div>
        <div><strong>Speech Pace:</strong> <span class="score-pill score-high">${c.speechMetrics.wpm} WPM</span></div>
        <div><strong>Hesitation:</strong> <span class="score-pill score-high">${c.speechMetrics.hesitation}</span></div>
      </div>
    </div>

    <div class="modal-section">
      <h4 class="modal-section-title">30-60-90 Day Tailored Roadmap</h4>
      <div class="roadmap-timeline">
        <div class="roadmap-col">
          <h5>Day 1–30</h5>
          <p>${c.roadmap.d30}</p>
        </div>
        <div class="roadmap-col">
          <h5>Day 31–60</h5>
          <p>${c.roadmap.d60}</p>
        </div>
        <div class="roadmap-col">
          <h5>Day 61–90</h5>
          <p>${c.roadmap.d90}</p>
        </div>
      </div>
    </div>

    <div class="modal-section">
      <h4 class="modal-section-title">Key Strengths & Growth Areas</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div>
          <strong style="color: var(--color-success); font-size: 0.82rem;">Key Strengths:</strong>
          <ul style="margin-top: 6px;">
            ${c.strengths.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
        <div>
          <strong style="color: var(--color-warning); font-size: 0.82rem;">Areas of Improvement:</strong>
          <ul style="margin-top: 6px;">
            ${c.weaknesses.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    <div class="modal-section" style="background: rgba(99, 102, 241, 0.08); border-color: rgba(99, 102, 241, 0.25);">
      <h4 class="modal-section-title" style="color: #818cf8;">Committee Action Recommendation</h4>
      <p style="color: var(--text-primary); font-weight: 600;">${c.action}</p>
    </div>
  `;
}

function renderModalStage1Tab(c) {
  const answers = c.stage1Answers || [];
  const rightCount = answers.filter(a => a.isRight).length;
  const wrongCount = answers.length - rightCount;

  return `
    <div class="modal-answer-summary-bar">
      <div class="score-chip">
        <span class="score-chip-label">Accuracy</span>
        <span class="score-chip-val" style="color: ${c.aptitudeScore >= 75 ? 'var(--color-success)' : 'var(--color-danger)'};">${c.aptitudeScore}%</span>
      </div>
      <div class="score-chip">
        <span class="score-chip-label">Right Answers</span>
        <span class="score-chip-val text-success">✅ ${rightCount}</span>
      </div>
      <div class="score-chip">
        <span class="score-chip-label">Wrong Answers</span>
        <span class="score-chip-val text-danger">❌ ${wrongCount}</span>
      </div>
      <div class="score-chip">
        <span class="score-chip-label">Status</span>
        <span class="score-chip-val">${c.aptitudeScore >= 75 ? 'PASS' : 'BELOW CUTOFF'}</span>
      </div>
    </div>

    <div class="answer-records-list">
      ${answers.map((item, idx) => `
        <div class="answer-record-item ${item.isRight ? 'record-right' : 'record-wrong'}">
          <div class="record-header">
            <div class="flex-align gap-2">
              <span class="record-num">Q${item.id || idx+1}</span>
              <span class="badge badge-topic">${item.topic}</span>
            </div>
            <div class="flex-align gap-2">
              <span class="record-time">⏱️ ${item.timeTaken}</span>
              <button class="status-toggle-btn ${item.isRight ? 'btn-status-right' : 'btn-status-wrong'}" onclick="toggleModalAnswerStatus(${c.id}, 1, ${idx})" title="Click to toggle Right/Wrong">
                ${item.isRight ? '✅ Right' : '❌ Wrong'}
              </button>
            </div>
          </div>
          <p class="record-question"><strong>Question:</strong> ${item.question}</p>
          <div class="record-comparison">
            <div class="comp-box cand-ans">
              <span class="comp-label">Candidate Answer:</span>
              <span class="comp-text ${item.isRight ? 'text-success' : 'text-danger'}">${item.candidateAnswer}</span>
            </div>
            <div class="comp-box correct-ans">
              <span class="comp-label">Expected Answer:</span>
              <span class="comp-text">${item.correctAnswer}</span>
            </div>
          </div>
          <div class="record-explanation">
            <small><strong>Evaluation Note:</strong> ${item.explanation}</small>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderModalStage2Tab(c) {
  const problems = c.stage2Problems || [];
  const rightCount = problems.filter(p => p.isRight).length;
  const wrongCount = problems.length - rightCount;

  return `
    <div class="modal-answer-summary-bar">
      <div class="score-chip">
        <span class="score-chip-label">Coding Score</span>
        <span class="score-chip-val text-success">${c.codingScore} / 5.0</span>
      </div>
      <div class="score-chip">
        <span class="score-chip-label">Test Suites Passed</span>
        <span class="score-chip-val text-success">✅ ${rightCount}</span>
      </div>
      <div class="score-chip">
        <span class="score-chip-label">Test Suites Failed</span>
        <span class="score-chip-val text-danger">❌ ${wrongCount}</span>
      </div>
      <div class="score-chip">
        <span class="score-chip-label">Big-O Efficiency</span>
        <span class="complexity-badge">${c.complexity}</span>
      </div>
    </div>

    <div class="answer-records-list">
      ${problems.map((p, idx) => `
        <div class="answer-record-item ${p.isRight ? 'record-right' : 'record-wrong'}">
          <div class="record-header">
            <div class="flex-align gap-2">
              <span class="record-num">Challenge #${p.id || idx+1}</span>
              <span class="badge badge-topic">${p.topic}</span>
            </div>
            <div class="flex-align gap-2">
              <span class="complexity-badge">${p.complexity}</span>
              <button class="status-toggle-btn ${p.isRight ? 'btn-status-right' : 'btn-status-wrong'}" onclick="toggleModalAnswerStatus(${c.id}, 2, ${idx})" title="Click to toggle Pass/Fail">
                ${p.isRight ? '✅ Pass' : '❌ Fail'}
              </button>
            </div>
          </div>
          <h4 style="margin: 6px 0; font-size: 0.95rem;">${p.title}</h4>
          <div class="record-comparison">
            <div class="comp-box">
              <span class="comp-label">Test Cases Passed:</span>
              <span class="comp-text ${p.isRight ? 'text-success' : 'text-danger'}"><strong>${p.passedTestCases}</strong></span>
            </div>
            <div class="comp-box">
              <span class="comp-label">Target Big-O:</span>
              <span class="comp-text">${p.targetComplexity}</span>
            </div>
          </div>
          <div class="record-explanation" style="margin-top: 8px;">
            <p style="margin-bottom: 4px;"><strong style="color:var(--accent-primary);">Key Edge Case:</strong> ${p.keyEdgeCase}</p>
            <small><strong>Code Review / Feedback:</strong> ${p.notes}</small>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Toggle right / wrong from modal and update state
function toggleModalAnswerStatus(candidateId, stage, index) {
  const c = candidates.find(item => item.id === candidateId);
  if (!c) return;

  if (stage === 1 && c.stage1Answers && c.stage1Answers[index]) {
    c.stage1Answers[index].isRight = !c.stage1Answers[index].isRight;
  } else if (stage === 2 && c.stage2Problems && c.stage2Problems[index]) {
    c.stage2Problems[index].isRight = !c.stage2Problems[index].isRight;
  }

  recalculateCandidateStats(c);
  renderModalBody(c);
  applyFilters();
  renderRecorderAnswerList();
  updateCharts();
}

// --- Interactive Stage 1 & Stage 2 Live Answer Recorder Section Logic ---
let currentRecorderCandidateId = 0;
let currentRecorderStage = 1;
let currentRecorderFilter = "all"; // all, right, wrong

function initAnswerRecorderSection() {
  const candSelect = document.getElementById("recorderCandidateSelect");
  if (candSelect) {
    candSelect.innerHTML = candidates.map(c => `<option value="${c.id}">${c.name} (${c.verdict})</option>`).join('');
    candSelect.addEventListener("change", (e) => {
      currentRecorderCandidateId = parseInt(e.target.value, 10);
      renderRecorderAnswerList();
    });
  }

  const stageBtns = document.querySelectorAll(".rec-stage-btn");
  stageBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      stageBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentRecorderStage = parseInt(btn.dataset.stage, 10);
      renderRecorderAnswerList();
    });
  });

  const filterBtns = document.querySelectorAll(".rec-filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentRecorderFilter = btn.dataset.filter;
      renderRecorderAnswerList();
    });
  });

  const recordForm = document.getElementById("newAnswerForm");
  if (recordForm) {
    recordForm.addEventListener("submit", handleRecordNewAnswer);
  }

  renderRecorderAnswerList();
}

function focusAnswerRecorderForCandidate(candidateId) {
  currentRecorderCandidateId = candidateId;
  const candSelect = document.getElementById("recorderCandidateSelect");
  if (candSelect) candSelect.value = candidateId;

  renderRecorderAnswerList();
  const section = document.getElementById("answerRecorderSection");
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

function renderRecorderAnswerList() {
  const container = document.getElementById("recorderAnswersContainer");
  const statsBox = document.getElementById("recorderSummaryStats");
  if (!container) return;

  const c = candidates.find(item => item.id === currentRecorderCandidateId) || candidates[0];

  if (currentRecorderStage === 1) {
    const answers = c.stage1Answers || [];
    const rightCount = answers.filter(a => a.isRight).length;
    const wrongCount = answers.length - rightCount;

    if (statsBox) {
      statsBox.innerHTML = `
        <div class="rec-stat-card">
          <span class="rec-stat-num" style="color: ${c.aptitudeScore >= 75 ? 'var(--color-success)' : 'var(--color-danger)'};">${c.aptitudeScore}%</span>
          <span class="rec-stat-label">Stage 1 Aptitude Accuracy</span>
        </div>
        <div class="rec-stat-card">
          <span class="rec-stat-num text-success">✅ ${rightCount}</span>
          <span class="rec-stat-label">Right Answers</span>
        </div>
        <div class="rec-stat-card">
          <span class="rec-stat-num text-danger">❌ ${wrongCount}</span>
          <span class="rec-stat-label">Wrong Answers</span>
        </div>
        <div class="rec-stat-card">
          <span class="rec-stat-num" style="color: var(--accent-primary);">${answers.length}</span>
          <span class="rec-stat-label">Total Questions Evaluated</span>
        </div>
      `;
    }

    const filtered = answers.filter(a => {
      if (currentRecorderFilter === "right") return a.isRight;
      if (currentRecorderFilter === "wrong") return !a.isRight;
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">No answers found for filter "${currentRecorderFilter}".</div>`;
      return;
    }

    container.innerHTML = filtered.map((item, originalIndex) => {
      const realIndex = answers.indexOf(item);
      return `
        <div class="recorder-answer-row ${item.isRight ? 'row-right' : 'row-wrong'}">
          <div class="rec-row-left">
            <div class="flex-align gap-2" style="margin-bottom: 4px;">
              <span class="rec-q-num">Q${item.id || realIndex+1}</span>
              <span class="badge badge-topic">${item.topic}</span>
              <span class="record-time">⏱️ ${item.timeTaken}</span>
            </div>
            <p class="rec-q-text">${item.question}</p>
            <div class="rec-ans-flex">
              <div><strong style="color:var(--text-secondary);">Candidate:</strong> <span class="${item.isRight ? 'text-success' : 'text-danger'}">${item.candidateAnswer}</span></div>
              <div><strong style="color:var(--text-secondary);">Expected:</strong> <span>${item.correctAnswer}</span></div>
            </div>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 4px;">${item.explanation}</div>
          </div>
          <div class="rec-row-right">
            <button class="status-toggle-btn ${item.isRight ? 'btn-status-right' : 'btn-status-wrong'}" onclick="toggleRecorderAnswer(${c.id}, 1, ${realIndex})" title="Click to toggle status">
              ${item.isRight ? '✅ Right' : '❌ Wrong'}
            </button>
          </div>
        </div>
      `;
    }).join('');

  } else {
    // Stage 2 Coding Challenges
    const problems = c.stage2Problems || [];
    const rightCount = problems.filter(p => p.isRight).length;
    const wrongCount = problems.length - rightCount;

    if (statsBox) {
      statsBox.innerHTML = `
        <div class="rec-stat-card">
          <span class="rec-stat-num text-success">${c.codingScore} / 5.0</span>
          <span class="rec-stat-label">Stage 2 Coding Score</span>
        </div>
        <div class="rec-stat-card">
          <span class="rec-stat-num text-success">✅ ${rightCount}</span>
          <span class="rec-stat-label">Test Suites Passed</span>
        </div>
        <div class="rec-stat-card">
          <span class="rec-stat-num text-danger">❌ ${wrongCount}</span>
          <span class="rec-stat-label">Test Suites Failed</span>
        </div>
        <div class="rec-stat-card">
          <span class="rec-stat-num" style="color: var(--color-warning);">${c.complexity.split(' ')[0]}</span>
          <span class="rec-stat-label">Big-O Complexity</span>
        </div>
      `;
    }

    const filtered = problems.filter(p => {
      if (currentRecorderFilter === "right") return p.isRight;
      if (currentRecorderFilter === "wrong") return !p.isRight;
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">No coding problems found for filter "${currentRecorderFilter}".</div>`;
      return;
    }

    container.innerHTML = filtered.map((item, originalIndex) => {
      const realIndex = problems.indexOf(item);
      return `
        <div class="recorder-answer-row ${item.isRight ? 'row-right' : 'row-wrong'}">
          <div class="rec-row-left">
            <div class="flex-align gap-2" style="margin-bottom: 4px;">
              <span class="rec-q-num">Challenge #${item.id || realIndex+1}</span>
              <span class="badge badge-topic">${item.topic}</span>
              <span class="complexity-badge">${item.complexity}</span>
            </div>
            <h4 style="margin-bottom: 4px; font-size: 0.95rem;">${item.title}</h4>
            <div class="rec-ans-flex">
              <div><strong style="color:var(--text-secondary);">Test Cases:</strong> <span class="${item.isRight ? 'text-success' : 'text-danger'}">${item.passedTestCases}</span></div>
              <div><strong style="color:var(--text-secondary);">Target:</strong> <span>${item.targetComplexity}</span></div>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px;"><strong>Edge Case:</strong> ${item.keyEdgeCase}</div>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">${item.notes}</div>
          </div>
          <div class="rec-row-right">
            <button class="status-toggle-btn ${item.isRight ? 'btn-status-right' : 'btn-status-wrong'}" onclick="toggleRecorderAnswer(${c.id}, 2, ${realIndex})" title="Click to toggle Pass/Fail">
              ${item.isRight ? '✅ Pass' : '❌ Fail'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

function toggleRecorderAnswer(candidateId, stage, index) {
  const c = candidates.find(item => item.id === candidateId);
  if (!c) return;

  if (stage === 1 && c.stage1Answers && c.stage1Answers[index]) {
    c.stage1Answers[index].isRight = !c.stage1Answers[index].isRight;
  } else if (stage === 2 && c.stage2Problems && c.stage2Problems[index]) {
    c.stage2Problems[index].isRight = !c.stage2Problems[index].isRight;
  }

  recalculateCandidateStats(c);
  renderRecorderAnswerList();
  applyFilters();
  updateCharts();
}

function handleRecordNewAnswer(e) {
  e.preventDefault();
  const c = candidates.find(item => item.id === currentRecorderCandidateId);
  if (!c) return;

  const topicInput = document.getElementById("newAnsTopic");
  const questionInput = document.getElementById("newAnsQuestion");
  const candAnsInput = document.getElementById("newAnsCandAnswer");
  const correctAnsInput = document.getElementById("newAnsCorrectAnswer");
  const statusInput = document.getElementById("newAnsStatus");
  const notesInput = document.getElementById("newAnsNotes");

  const isRight = statusInput.value === "right";

  if (currentRecorderStage === 1) {
    if (!c.stage1Answers) c.stage1Answers = [];
    const newId = c.stage1Answers.length + 1;
    c.stage1Answers.push({
      id: newId,
      topic: topicInput.value.trim() || "General Logic",
      question: questionInput.value.trim() || `Recorded Question #${newId}`,
      candidateAnswer: candAnsInput.value.trim() || (isRight ? "Correct derivation" : "Incorrect answer"),
      correctAnswer: correctAnsInput.value.trim() || "Standard answer",
      isRight: isRight,
      timeTaken: "Live Entry",
      explanation: notesInput.value.trim() || "Recorded live by evaluator."
    });
  } else {
    if (!c.stage2Problems) c.stage2Problems = [];
    const newId = c.stage2Problems.length + 1;
    c.stage2Problems.push({
      id: newId,
      title: questionInput.value.trim() || `Live Coding Challenge #${newId}`,
      topic: topicInput.value.trim() || "Algorithms & Logic",
      targetComplexity: "O(n)",
      complexity: isRight ? "O(n) Optimal" : "O(n²) Inefficient",
      passedTestCases: isRight ? "10/10" : "5/10",
      isRight: isRight,
      keyEdgeCase: candAnsInput.value.trim() || "Live test scenario",
      notes: notesInput.value.trim() || "Recorded during live interview round."
    });
  }

  recalculateCandidateStats(c);
  renderRecorderAnswerList();
  applyFilters();
  updateCharts();

  // Reset form inputs
  questionInput.value = "";
  candAnsInput.value = "";
  correctAnsInput.value = "";
  notesInput.value = "";

  alert(`✅ Successfully recorded new ${currentRecorderStage === 1 ? 'Stage 1 Aptitude Question' : 'Stage 2 Coding Problem'} for ${c.name}! Candidate score and verdict re-evaluated.`);
}

// --- Chart.js Initializations & Stage Performance Logic ---
let radarChartInstance = null;
let barChartInstance = null;
let currentStageView = "all";

const radarLabels = ["Problem Solving", "Coding Efficiency", "System Design", "Communication", "Authenticity / Honesty"];

function updateStageView(stage) {
  currentStageView = stage;
  const isLight = document.body.getAttribute("data-theme") === "light";
  const gridColor = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const textColor = isLight ? "#475569" : "#9ca3af";

  const badge = document.getElementById("activeStageBadge");
  const subtitle = document.getElementById("activeStageSubtitle");
  const chipRow = document.getElementById("stageMetricsChipRow");
  const strip = document.getElementById("stageCandidateStrip");

  document.querySelectorAll(".stage-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.stage === stage);
  });

  if (!barChartInstance) return;
  const names = candidates.map(c => c.name.split(' ')[0]);

  if (stage === "all") {
    if (badge) { badge.className = "badge badge-info"; badge.textContent = "Overview Mode"; }
    if (subtitle) subtitle.textContent = "Normalized multi-gate performance index across Aptitude, Coding & Interview";

    if (chipRow) {
      chipRow.innerHTML = `
        <div class="stage-chip"><span class="chip-label">Stage 1 Cutoff</span><span class="chip-val">≥ 75% Accuracy</span></div>
        <div class="stage-chip"><span class="chip-label">Stage 2 Benchmark</span><span class="chip-val">≥ 3.5/5.0 (O(n log n))</span></div>
        <div class="stage-chip"><span class="chip-label">Stage 3 Gate</span><span class="chip-val">≥ 3.5/5.0 (0 Bluff Flags)</span></div>
      `;
    }

    barChartInstance.data.labels = names;
    barChartInstance.data.datasets = [
      {
        label: "Stage 1: Aptitude (%)",
        data: candidates.map(c => c.aptitudeScore),
        backgroundColor: "#3b82f6",
        borderRadius: 6
      },
      {
        label: "Stage 2: Coding (x20)",
        data: candidates.map(c => Math.round(c.codingScore * 20)),
        backgroundColor: "#10b981",
        borderRadius: 6
      },
      {
        label: "Stage 3: Interview (x20)",
        data: candidates.map(c => Math.round(c.interviewScore * 20)),
        backgroundColor: "#8b5cf6",
        borderRadius: 6
      }
    ];

    if (strip) {
      strip.innerHTML = candidates.map(c => {
        const s1R = c.stage1Answers ? c.stage1Answers.filter(a => a.isRight).length : 0;
        const s2R = c.stage2Problems ? c.stage2Problems.filter(p => p.isRight).length : 0;
        return `
          <div class="stage-cand-box">
            <div class="stage-cand-header">
              <span class="stage-cand-name">${c.name.split(' ')[0]}</span>
              <span class="badge ${c.verdictClass}" style="font-size:0.65rem; padding:2px 6px;">${c.verdict}</span>
            </div>
            <span class="stage-cand-score" style="color:#6366f1;">${Math.round((c.aptitudeScore + c.codingScore*20 + c.interviewScore*20)/3)}% Avg</span>
            <span class="stage-cand-metric">S1: ${s1R}✅ | S2: ${s2R}✅</span>
          </div>
        `;
      }).join('');
    }

  } else if (stage === "1") {
    if (badge) { badge.className = "badge badge-primary"; badge.textContent = "Stage 1: Aptitude & Logic (Right vs Wrong Answers)"; }
    if (subtitle) subtitle.textContent = "Quantitative logic, analytical accuracy, and right vs wrong answer breakdown";

    if (chipRow) {
      chipRow.innerHTML = `
        <div class="stage-chip"><span class="chip-label">Pass Cutoff</span><span class="chip-val">75.0%</span></div>
        <div class="stage-chip"><span class="chip-label">Top Performer</span><span class="chip-val">Aarav (23 Right, 92%)</span></div>
        <div class="stage-chip"><span class="chip-label">Batch Pass Rate</span><span class="chip-val">80% (4/5 passed)</span></div>
      `;
    }

    barChartInstance.data.labels = names;
    barChartInstance.data.datasets = [
      {
        label: "Right Answers Count",
        data: candidates.map(c => c.stage1Answers ? c.stage1Answers.filter(a => a.isRight).length : 0),
        backgroundColor: "#10b981",
        borderRadius: 6
      },
      {
        label: "Wrong Answers Count",
        data: candidates.map(c => c.stage1Answers ? c.stage1Answers.filter(a => !a.isRight).length : 0),
        backgroundColor: "#ef4444",
        borderRadius: 6
      }
    ];

    if (strip) {
      strip.innerHTML = candidates.map(c => {
        const s1R = c.stage1Answers ? c.stage1Answers.filter(a => a.isRight).length : 0;
        const s1W = c.stage1Answers ? c.stage1Answers.length - s1R : 0;
        return `
          <div class="stage-cand-box">
            <div class="stage-cand-header">
              <span class="stage-cand-name">${c.name.split(' ')[0]}</span>
              <span class="badge ${c.aptitudeScore >= 75 ? 'badge-success' : 'badge-danger'}" style="font-size:0.65rem; padding:2px 6px;">
                ${c.aptitudeScore >= 75 ? 'Pass' : 'Fail'}
              </span>
            </div>
            <span class="stage-cand-score">${c.aptitudeScore}%</span>
            <span class="stage-cand-metric">✅ ${s1R} Right • ❌ ${s1W} Wrong</span>
          </div>
        `;
      }).join('');
    }

  } else if (stage === "2") {
    if (badge) { badge.className = "badge badge-success"; badge.textContent = "Stage 2: Live Coding & Big-O (Pass vs Fail Test Suites)"; }
    if (subtitle) subtitle.textContent = "Algorithmic thinking, Big-O efficiency, and passed vs failed test cases";

    if (chipRow) {
      chipRow.innerHTML = `
        <div class="stage-chip"><span class="chip-label">Benchmark Threshold</span><span class="chip-val">3.5 / 5.0</span></div>
        <div class="stage-chip"><span class="chip-label">Optimal Runtime</span><span class="chip-val">Aarav (5/5 Passed, O(n))</span></div>
        <div class="stage-chip"><span class="chip-label">Bottlenecks Flagged</span><span class="chip-val">2 (Vikram O(n²), Rohan O(n³))</span></div>
      `;
    }

    barChartInstance.data.labels = names;
    barChartInstance.data.datasets = [
      {
        label: "Passed Test Suites",
        data: candidates.map(c => c.stage2Problems ? c.stage2Problems.filter(p => p.isRight).length : 0),
        backgroundColor: "#10b981",
        borderRadius: 6
      },
      {
        label: "Failed Test Suites",
        data: candidates.map(c => c.stage2Problems ? c.stage2Problems.filter(p => !p.isRight).length : 0),
        backgroundColor: "#ef4444",
        borderRadius: 6
      }
    ];

    if (strip) {
      strip.innerHTML = candidates.map(c => {
        const s2R = c.stage2Problems ? c.stage2Problems.filter(p => p.isRight).length : 0;
        const s2W = c.stage2Problems ? c.stage2Problems.length - s2R : 0;
        return `
          <div class="stage-cand-box">
            <div class="stage-cand-header">
              <span class="stage-cand-name">${c.name.split(' ')[0]}</span>
              <span class="complexity-badge">${c.complexity.split(' ')[0]}</span>
            </div>
            <span class="stage-cand-score">${c.codingScore} / 5.0</span>
            <span class="stage-cand-metric">✅ ${s2R} Passed • ❌ ${s2W} Failed</span>
          </div>
        `;
      }).join('');
    }

  } else if (stage === "3") {
    if (badge) { badge.className = "badge badge-accent"; badge.textContent = "Stage 3: Panel & Bluffing Scanner"; }
    if (subtitle) subtitle.textContent = "Resume validation, truth veracity, communication, and culture fit";

    if (chipRow) {
      chipRow.innerHTML = `
        <div class="stage-chip"><span class="chip-label">Gate Threshold</span><span class="chip-val">3.5 / 5.0 (0 Flags)</span></div>
        <div class="stage-chip"><span class="chip-label">Integrity Red Flags</span><span class="chip-val text-danger">1 (Vikram Mehta)</span></div>
        <div class="stage-chip"><span class="chip-label">Top Articulation</span><span class="chip-val">Sneha K. (4.9 / 5.0)</span></div>
      `;
    }

    barChartInstance.data.labels = names;
    barChartInstance.data.datasets = [
      {
        label: "Interview Rating (/5.0)",
        data: candidates.map(c => c.interviewScore),
        backgroundColor: candidates.map(c => c.interviewScore >= 3.5 && c.bluffingRisk === "Zero Risk" ? "#8b5cf6" : "#ef4444"),
        borderRadius: 6
      },
      {
        label: "Truth & Authenticity (%)",
        data: candidates.map(c => c.metrics.authenticity),
        backgroundColor: "rgba(139, 92, 246, 0.35)",
        borderRadius: 6
      }
    ];

    if (strip) {
      strip.innerHTML = candidates.map(c => `
        <div class="stage-cand-box">
          <div class="stage-cand-header">
            <span class="stage-cand-name">${c.name.split(' ')[0]}</span>
            <span class="badge ${c.bluffingClass}" style="font-size:0.62rem; padding:2px 6px;">${c.bluffingRisk}</span>
          </div>
          <span class="stage-cand-score">${c.interviewScore} / 5.0</span>
          <span class="stage-cand-metric">Authenticity: ${c.metrics.authenticity}%</span>
        </div>
      `).join('');
    }
  }

  barChartInstance.update();
}

function initCharts() {
  const isLight = document.body.getAttribute("data-theme") === "light";
  const gridColor = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const textColor = isLight ? "#475569" : "#9ca3af";

  // 1. Competency Radar Chart
  const radarCanvas = document.getElementById("competencyRadarChart");
  if (radarCanvas) {
    const radarCtx = radarCanvas.getContext("2d");
    const palette = [
      { border: "#6366f1", bg: "rgba(99, 102, 241, 0.2)" },
      { border: "#10b981", bg: "rgba(16, 185, 129, 0.2)" },
      { border: "#ef4444", bg: "rgba(239, 68, 68, 0.2)" },
      { border: "#94a3b8", bg: "rgba(148, 163, 184, 0.2)" },
      { border: "#f59e0b", bg: "rgba(245, 158, 11, 0.2)" }
    ];

    const datasets = candidates.map((c, i) => ({
      label: c.name,
      data: [
        c.metrics.problemSolving,
        c.metrics.codingEfficiency,
        c.metrics.systemDesign,
        c.metrics.communication,
        c.metrics.authenticity
      ],
      backgroundColor: palette[i].bg,
      borderColor: palette[i].border,
      borderWidth: 2,
      pointBackgroundColor: palette[i].border,
      pointRadius: 3
    }));

    radarChartInstance = new Chart(radarCtx, {
      type: "radar",
      data: { labels: radarLabels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 20,
            max: 100,
            ticks: { stepSize: 20, color: textColor, backdropColor: 'transparent' },
            grid: { color: gridColor },
            angleLines: { color: gridColor },
            pointLabels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
          }
        },
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } } }
        }
      }
    });
  }

  // 2. Stage Performance Bar Chart
  const barCanvas = document.getElementById("stageBarChart");
  if (barCanvas) {
    const barCtx = barCanvas.getContext("2d");
    barChartInstance = new Chart(barCtx, {
      type: "bar",
      data: { labels: candidates.map(c => c.name.split(' ')[0]), datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } } },
          y: { min: 0, max: 100, grid: { color: gridColor }, ticks: { color: textColor } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } } }
        }
      }
    });

    updateStageView("all");
  }

  // Stage Tab Event Listeners
  document.querySelectorAll(".stage-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      updateStageView(btn.dataset.stage);
    });
  });
}

function updateCharts() {
  if (radarChartInstance) radarChartInstance.destroy();
  if (barChartInstance) barChartInstance.destroy();
  initCharts();
}

// --- Standout Feature: 60-Second AI Voice Executive Debrief Audio Memo ---
let isSpeaking = false;

function stopSpeaking() {
  window.speechSynthesis.cancel();
  isSpeaking = false;
  const playAudioBtn = document.getElementById("playAudioBtn");
  const audioPulse = document.getElementById("audioPulse");
  const playBtnText = document.getElementById("playBtnText");
  if (playAudioBtn) playAudioBtn.classList.remove("playing");
  if (audioPulse) audioPulse.classList.remove("speaking");
  if (playBtnText) playBtnText.textContent = "Play AI Audio Memo";
}

// --- Standout Feature: Download Session Package ---
function exportSessionDossier() {
  const packageData = {
    platform: "Jobjugaad",
    module: "Module 4: Performance Engine",
    timestamp: new Date().toISOString(),
    sessionFolder: "session_20260901_assessment_batch",
    totalCandidates: candidates.length,
    pipelineSummary: {
      strongHire: candidates.filter(c => c.verdict === "Strong Hire").map(c => c.name),
      hire: candidates.filter(c => c.verdict === "Hire").map(c => c.name),
      rolePivot: candidates.filter(c => c.verdict === "Role Pivot").map(c => c.name),
      reject: candidates.filter(c => c.verdict === "Reject").map(c => c.name)
    },
    candidateDossiers: candidates
  };

  const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Jobjugaad_Performance_Session_With_Answer_Sheets_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Document Ready Setup
document.addEventListener("DOMContentLoaded", () => {
  renderCandidates(candidates);
  initCharts();
  initAnswerRecorderSection();

  // Search and Filter Listeners
  const candidateSearch = document.getElementById("candidateSearch");
  const decisionFilter = document.getElementById("decisionFilter");
  const bluffFilter = document.getElementById("bluffFilter");
  if (candidateSearch) candidateSearch.addEventListener("input", applyFilters);
  if (decisionFilter) decisionFilter.addEventListener("change", applyFilters);
  if (bluffFilter) bluffFilter.addEventListener("change", applyFilters);

  // Modal Closers
  const closeModalBtn = document.getElementById("closeModalBtn");
  const candidateModal = document.getElementById("candidateModal");
  if (closeModalBtn) closeModalBtn.addEventListener("click", () => candidateModal.classList.remove("active"));
  if (candidateModal) candidateModal.addEventListener("click", (e) => {
    if (e.target.id === "candidateModal") candidateModal.classList.remove("active");
  });

  // Theme Switcher
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.body.getAttribute("data-theme");
      if (currentTheme === "light") {
        document.body.removeAttribute("data-theme");
      } else {
        document.body.setAttribute("data-theme", "light");
      }
      updateCharts();
    });
  }

  // Radar Candidate Selector
  const radarCandidateSelect = document.getElementById("radarCandidateSelect");
  if (radarCandidateSelect) {
    radarCandidateSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      if (!radarChartInstance) return;
      if (val === "all") {
        radarChartInstance.data.datasets.forEach(ds => ds.hidden = false);
      } else {
        const idx = parseInt(val, 10);
        radarChartInstance.data.datasets.forEach((ds, i) => {
          ds.hidden = (i !== idx);
        });
      }
      radarChartInstance.update();
    });
  }

  // Audio Memo Controls
  const playAudioBtn = document.getElementById("playAudioBtn");
  const audioCandidateSelector = document.getElementById("audioCandidateSelector");
  const audioPulse = document.getElementById("audioPulse");
  const playBtnText = document.getElementById("playBtnText");
  const audioDesc = document.getElementById("audioCandidateSummary");

  if (audioCandidateSelector && audioDesc) {
    audioCandidateSelector.addEventListener("change", (e) => {
      const cand = candidates[parseInt(e.target.value, 10)];
      audioDesc.innerHTML = `Listen to AI synthesized summary for candidate: <strong>${cand.name}</strong> (${cand.verdict}).`;
      if (isSpeaking) stopSpeaking();
    });
  }

  if (playAudioBtn) {
    playAudioBtn.addEventListener("click", () => {
      if (isSpeaking) {
        stopSpeaking();
        return;
      }
      const candIndex = parseInt(audioCandidateSelector.value, 10);
      const cand = candidates[candIndex];

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cand.debriefScript);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          isSpeaking = true;
          playAudioBtn.classList.add("playing");
          if (audioPulse) audioPulse.classList.add("speaking");
          if (playBtnText) playBtnText.textContent = "Stop Audio Memo";
        };
        utterance.onend = stopSpeaking;
        utterance.onerror = stopSpeaking;
        window.speechSynthesis.speak(utterance);
      } else {
        alert("Speech Synthesis not supported in browser.\n\nScript: " + cand.debriefScript);
      }
    });
  }
});
