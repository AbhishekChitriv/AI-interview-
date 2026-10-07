# Candidate Evaluation & Performance Analysis Report
**Target Audience:** HR Leadership & Technical Hiring Managers  
**Date:** September 1, 2026  
**Document Version:** 2.0 — Comprehensive Stage 1 & 2 Question/Answer Audit  

---

## 1. Executive Summary

This report provides a multi-stage performance analysis of shortlisted candidates evaluated across the technical hiring pipeline. The evaluation assessed cognitive ability, practical programming capability, domain knowledge authenticity, and behavioral alignment with full granular tracking of **Right & Wrong answers** across Stage 1 (Aptitude & Reasoning) and Stage 2 (Coding & Problem Solving).

### Key Highlights
- **Total Candidates Evaluated:** 5
- **Recommended for Immediate Offer (Strong Hire):** 1 candidate (20%) — Aarav Sharma (23/25 S1 Right, 5/5 S2 Right)
- **Recommended with Conditions / Upskilling Plan (Hire):** 1 candidate (20%) — Priya Nair (21/25 S1 Right, 4/5 S2 Right)
- **Consider for Alternative Track / Product-Focused Role:** 1 candidate (20%) — Sneha Kulkarni (22/25 S1 Right, 4/5 S2 Right)
- **Rejected (Technical Gaps / Resume Inconsistencies / Bluffing):** 2 candidates (40%) — Vikram Mehta, Rohan Deshmukh

---

## 2. Assessment Framework & Scoring Criteria

Candidates were evaluated across three rigorous evaluation gates on a standard 1–5 scale (1: Unsatisfactory, 2: Below Expectations, 3: Meets Expectations, 4: Exceeds Expectations, 5: Exceptional).

```
   ┌──────────────────────────┐     ┌──────────────────────────┐     ┌──────────────────────────┐
   │ Stage 1: Aptitude        │ ──> │ Stage 2: Coding          │ ──> │ Stage 3: Final Panel     │
   │ • 25 Quant & Logic Items │     │ • 5 Coding Test Suites   │     │ • Resume Validation      │
   │ • Accuracy (Right/Wrong) │     │ • Big-O Complexity       │     │ • Integrity/Bluffing     │
   │ • Problem Solving Speed  │     │ • Edge Case Handling     │     │ • Communication & Fit    │
   └──────────────────────────┘     └──────────────────────────┘     └──────────────────────────┘
```

| Evaluation Stage | Focus Areas | Weight | Passing Threshold |
| :--- | :--- | :---: | :---: |
| **Stage 1: Aptitude & Reasoning** | Quantitative logic, analytical speed, error rate, critical reasoning (25 items) | 25% | ≥ 75% accuracy (≥ 19/25 Right) |
| **Stage 2: Coding & Logic** | Algorithmic thinking, time/space complexity, syntax fluency, clean architecture (5 test suites) | 40% | ≥ 3.5 / 5.0 (≥ 4/5 Passed) |
| **Stage 3: Final Panel & Fit** | Resume verification, communication, confidence, technical honesty, cultural fit | 35% | ≥ 3.5 / 5.0 (No bluffing flags) |

---

## 3. Individual Candidate Performance Profiles & Right/Wrong Answer Audits

---

### Candidate 1: Aarav Sharma
**Target Role:** Senior Full-Stack / Backend Engineer  
**Final Verdict:** 🟢 **STRONG HIRE (Tier 1 Offer)**

#### Multi-Stage Scorecard
| Stage | Metric | Score / Result | Right / Wrong Breakdown |
| :--- | :--- | :---: | :--- |
| **Stage 1: Aptitude** | Accuracy & Problem-Solving | **92%** (Top 5%) | 🟢 **23 Right / 2 Wrong** (out of 25 questions) |
| **Stage 2: Coding** | Logic, Proficiency, Efficiency | **4.8 / 5.0** | 🟢 **5 Passed / 0 Failed** ($O(n)$ Optimal) |
| **Stage 3: Interview** | Communication, Integrity, Fit | **4.7 / 5.0** | 🟢 **Zero Bluffing Flags** (100% Verified) |

#### Stage 1 Question-Level Error Log (Wrong Answers)
- **Q10 (Combinatorics):** Candidate answered `12,141` combinations; correct was `18,561`. Slight calculation discrepancy on unrestricted exponential complement.
- **Q25 (Data Sufficiency):** Overlooked necessity of combining both statements together for divisible by 6 rule.

#### Stage 2 Coding Challenges & Test Case Audit
- **Challenge 1 (LRU Cache with TTL Eviction):** ✅ **12/12 Test Cases Passed** — $O(1)$ Get/Put with Mutex Lock.
- **Challenge 2 (Distributed Token Bucket Rate Limiter):** ✅ **10/10 Test Cases Passed** — Atomic Lua script simulation.
- **Challenge 3 (Sliding Window Maximum Stream):** ✅ **15/15 Test Cases Passed** — Strict monotonic deque, $O(n)$ optimal.
- **Challenge 4 (Microservice Dependency DAG Cycle):** ✅ **8/8 Test Cases Passed** — Kahn's topological sort with cycle detector.
- **Challenge 5 (Lock-Free Bounded Queue Ring Buffer):** ✅ **14/14 Test Cases Passed** — Atomic CAS primitives without lock starvation.

* **Key Strengths:** Optimal algorithmic efficiency, deep concurrency mastery, authentic and candid communication.
* **Hiring Recommendation:** Extend immediate Senior Software Engineer offer within 24 hours.

---

### Candidate 2: Priya Nair
**Target Role:** Software Development Engineer (SDE-II)  
**Final Verdict:** 🟡 **HIRE (Standard Offer with 90-Day Mentorship Plan)**

#### Multi-Stage Scorecard
| Stage | Metric | Score / Result | Right / Wrong Breakdown |
| :--- | :--- | :---: | :--- |
| **Stage 1: Aptitude** | Accuracy & Problem-Solving | **84%** (Above Average) | 🟢 **21 Right / 4 Wrong** (out of 25 questions) |
| **Stage 2: Coding** | Logic, Proficiency, Efficiency | **3.8 / 5.0** | 🟢 **4 Passed / 1 Failed** ($O(n \log n)$ Refactored) |
| **Stage 3: Interview** | Communication, Integrity, Fit | **4.0 / 5.0** | 🟢 **Zero Bluffing Flags** (Transparent on Limits) |

#### Stage 1 Question-Level Error Log (Wrong Answers)
- **Q7 (Syllogism & Sets):** Inverted set intersection and union distributive precedence ($A \cap (B \cup C)$ instead of $A \cup (B \cap C)$).
- **Q11 (Algorithmic Tracing):** Quoted sub-optimal upper bound $O(\log(m+n))$ for 2-array median search.
- **Q21 (Clock Angle Puzzle):** Forgot continuous angular motion of hour hand at 3:15 (answered $0^\circ$, correct was $7.5^\circ$).
- **Q25 (Data Sufficiency):** Selected Statement 2 alone instead of requiring both statements together.

#### Stage 2 Coding Challenges & Test Case Audit
- **Challenge 1 (LRU Cache with TTL Eviction):** ✅ **12/12 Passed** — Clean DLL + HashMap.
- **Challenge 2 (Distributed Rate Limiter):** ❌ **8/10 Passed (2 Failed)** — Concurrency race condition during lock acquisition.
- **Challenge 3 (Sliding Window Maximum):** ✅ **15/15 Passed** — Initial $O(n^2)$ refactored to $O(n \log n)$ upon interviewer hint.
- **Challenge 4 (Graph Cycle Detection):** ✅ **8/8 Passed** — Standard DFS recursion with state tracking.
- **Challenge 5 (Binary Search Tree Validation):** ✅ **10/10 Passed** — Clean subtree min/max bound propagation.

* **Key Strengths:** Strong foundational logic, high coachability, transparent technical self-awareness.
* **Hiring Recommendation:** Roll out offer for SDE-II with assigned senior tech mentor for the first 90 days.

---

### Candidate 3: Vikram Mehta
**Target Role:** Backend Systems Engineer  
**Final Verdict:** 🔴 **REJECT (Integrity & Depth Gaps)**

#### Multi-Stage Scorecard
| Stage | Metric | Score / Result | Right / Wrong Breakdown |
| :--- | :--- | :---: | :--- |
| **Stage 1: Aptitude** | Accuracy & Problem-Solving | **78%** (Borderline) | 🟡 **19 Right / 6 Wrong** (out of 25 questions) |
| **Stage 2: Coding** | Logic, Proficiency, Efficiency | **3.1 / 5.0** | 🔴 **3 Passed / 2 Failed** ($O(n^2)$ Brute Force) |
| **Stage 3: Interview** | Communication, Integrity, Fit | **2.0 / 5.0** | 🔴 **High Risk / Bluffing Red Flags Flagged** |

#### Stage 1 Question-Level Error Log (Wrong Answers)
- **Q2 (Quantitative Logic):** Fractional reciprocal sum error on 3-worker rates.
- **Q4 (Data Interpretation):** Neglected amortized depreciation deductions on quarterly margin graph.
- **Q6 (Probability):** Assumed independent replacement probabilities without decrementing denominator.
- **Q11 (Algorithmic Tracing):** Was unaware of binary search partitioning on median problem ($O(m+n)$ linear brute force).
- **Q16 (Game Theory):** Incorrect XOR balance computation on Nim heap allocation.
- **Q22 (Recursive Relation):** Incorrectly guessed quadratic exponent overhead on Master Theorem Case 2.

#### Stage 2 Coding Challenges & Test Case Audit
- **Challenge 1 (LRU Cache with TTL Eviction):** ❌ **6/12 Passed (6 Failed)** — Used list pop(0) resulting in $O(n)$ search and evictions.
- **Challenge 2 (Distributed Rate Limiter):** ❌ **4/10 Passed (6 Failed)** — Deadlock under simulated load; used blocking sleep calls.
- **Challenge 3 (Sliding Window Maximum):** ❌ **10/15 Passed (5 Failed)** — $O(n^2)$ timed out on $100k$ element inputs.
- **Challenge 4 (Graph Cycle Detection):** ✅ **8/8 Passed** — Basic adjacency list BFS (poor variable naming).
- **Challenge 5 (BST Validation & Range Query):** ✅ **10/10 Passed** — Passed recursive range checks.

* **Critical Flaws:** Inaccurate resume claims (500k RPS), unable to explain basic database sharding, evasive bluffing tendencies.
* **Hiring Recommendation:** Disqualify candidate immediately.

---

### Candidate 4: Rohan Deshmukh
**Target Role:** Full-Stack Developer  
**Final Verdict:** 🔴 **REJECT (Technical Inefficiency & Sub-threshold Logic)**

#### Multi-Stage Scorecard
| Stage | Metric | Score / Result | Right / Wrong Breakdown |
| :--- | :--- | :---: | :--- |
| **Stage 1: Aptitude** | Accuracy & Problem-Solving | **58%** (Failed Cutoff) | 🔴 **14 Right / 11 Wrong** (out of 25 questions) |
| **Stage 2: Coding** | Logic, Proficiency, Efficiency | **2.2 / 5.0** | 🔴 **2 Passed / 3 Failed** ($O(n^3)$ Inefficient) |
| **Stage 3: Interview** | Communication, Integrity, Fit | **2.8 / 5.0** | 🟢 **Zero Bluffing** (Honest, but Low Technical Readiness) |

#### Stage 1 Question-Level Error Log (Wrong Answers - 11 Errors)
- Missed Q1 (Categorical Syllogism), Q2 (Work Rates), Q4 (Graph Scale Reading), Q6 (3-chip Draw Probability), Q7 (Boolean Algebra), Q10 (Permutations), Q11 (Complexity Class), Q13 (Modular Exponent), Q15 (Matrix Determinant sum instead of product), Q16 (Game Theory), Q21 (Clock Hand Movement).

#### Stage 2 Coding Challenges & Test Case Audit
- **Challenge 1 (LRU Cache):** ❌ **3/12 Passed** — Uncaught NullPointerException on empty list removal.
- **Challenge 2 (Rate Limiter):** ❌ **1/10 Passed** — Infinite loop on negative parameters; incomplete solution.
- **Challenge 3 (Sliding Window Maximum):** ❌ **5/15 Passed** — Triple nested loops ($O(n^3)$) with severe timeouts.
- **Challenge 4 (Graph Cycle Detection):** ✅ **8/8 Passed** — Adjacency list BFS.
- **Challenge 5 (Anagram & Palindrome Validator):** ✅ **10/10 Passed** — Clean character frequency hash map.

* **Critical Flaws:** Sub-threshold logical reasoning (58%), inefficient cubic coding complexity, syntax hesitation.
* **Hiring Recommendation:** Standard rejection notice with guidance on DSA curriculum upskilling.

---

### Candidate 5: Sneha Kulkarni
**Target Role:** Technical Solutions / Product Engineer  
**Final Verdict:** 🔵 **ROLE PIVOT (Solutions / Product Engineering Track)**

#### Multi-Stage Scorecard
| Stage | Metric | Score / Result | Right / Wrong Breakdown |
| :--- | :--- | :---: | :--- |
| **Stage 1: Aptitude** | Accuracy & Problem-Solving | **88%** (High) | 🟢 **22 Right / 3 Wrong** (out of 25 questions) |
| **Stage 2: Coding** | Logic, Proficiency, Efficiency | **3.4 / 5.0** | 🟢 **4 Passed / 1 Failed** ($O(n \log n)$ Clean) |
| **Stage 3: Interview** | Communication, Integrity, Fit | **4.9 / 5.0** | 🟢 **Zero Bluffing Flags** (Superb Articulation) |

#### Stage 1 Question-Level Error Log (Wrong Answers)
- **Q16 (Game Theory):** Minor miscalculation in binary sum balance.
- **Q24 (Cryptarithmetic):** Over-calculated carry bit addition ($M=2$ instead of $1$).
- **Q25 (Data Sufficiency):** Rushed through statement requirement checks.

#### Stage 2 Coding Challenges & Test Case Audit
- **Challenge 1 (LRU Cache):** ✅ **12/12 Passed** — Highly modular architecture with clean unit tests.
- **Challenge 2 (Rate Limiter):** ❌ **8/10 Passed** — Slight latency overhead on microsecond clock sync edge case.
- **Challenge 3 (Sliding Window Maximum):** ✅ **15/15 Passed** — Clean heap-based window tracking with comprehensive docstrings.
- **Challenge 4 (Graph Cycle Detection):** ✅ **8/8 Passed** — Clean topological recursion.
- **Challenge 5 (REST API Endpoint & Webhook Dispatcher):** ✅ **10/10 Passed** — Exceptional exponential backoff retry with jitter.

* **Key Strengths:** Superb stakeholder communication, empathetic architectural trade-off design, rapid prototyping.
* **Hiring Recommendation:** Pivot offer to **Lead Technical Solutions Engineer / Product Engineer**.

---

## 4. Cross-Candidate Comparative Matrix (With Right/Wrong Tallies)

| Candidate Name | Stage 1 Aptitude (Right/Wrong) | Stage 2 Coding (Pass/Fail) | Coding Complexity | Bluffing Risk Level | Final Recommendation |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Aarav Sharma** | **92%** (23 ✅ / 2 ❌) | **4.8** (5 ✅ / 0 ❌) | Optimal ($O(n)$) | 🟢 **Zero Risk** | **Strong Hire** (Immediate Offer) |
| **Priya Nair** | **84%** (21 ✅ / 4 ❌) | **3.8** (4 ✅ / 1 ❌) | Moderate ($O(n \log n)$) | 🟢 **Zero Risk** | **Hire** (SDE-II + Mentorship) |
| **Vikram Mehta** | **78%** (19 ✅ / 6 ❌) | **3.1** (3 ✅ / 2 ❌) | Poor ($O(n^2)$) | 🔴 **High Risk** | **Reject** (Integrity / Bluffing) |
| **Rohan Deshmukh** | **58%** (14 ✅ / 11 ❌) | **2.2** (2 ✅ / 3 ❌) | Inefficient ($O(n^3)$) | 🟢 **Zero Risk** | **Reject** (Technical Baseline Gap) |
| **Sneha Kulkarni** | **88%** (22 ✅ / 3 ❌) | **3.4** (4 ✅ / 1 ❌) | Good ($O(n \log n)$) | 🟢 **Zero Risk** | **Role Pivot** (Solutions/Product Track) |

---

## 5. Strategic Recommendations & Automated Tooling

1. **Answer Recording Feature:** The web assessment engine now features an interactive **Stage 1 & 2 Live Answer Recorder & Grader** allowing panels to log real-time test outcomes and automatically update competency scores.
2. **Standardized Question Bank:** Deploy the 25 validated Stage 1 items and 5 Stage 2 coding challenge test suites across all subsequent evaluation batches.
3. **Session Package Export:** Full question-by-question Right and Wrong answer logs are exported as JSON dossiers with the session package for auditing and compliance.

---
*Report compiled by Technical Recruitment & Engineering Assessment Committee.*
