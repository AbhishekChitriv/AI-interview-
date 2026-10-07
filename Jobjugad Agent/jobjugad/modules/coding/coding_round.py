import json
import os
import random
import time
import uuid
from collections import Counter, deque
from typing import Any, Deque, Dict, List, Optional, Tuple

try:
    from .llm import get_openai_client          # when imported as a package
except ImportError:
    from llm import get_openai_client            # when this folder is on sys.path

# Difficulty distribution for the 5-question coding round: 2 Easy, 2 Moderate, 1 Hard.
DIFFICULTY_SEQUENCE = ["Easy", "Easy", "Moderate", "Moderate", "Hard"]

# Cross-session memory of the last question titles this process handed out, so
# back-to-back candidates on the same server don't get an identical-looking set.
# In-memory only (fine — it's a "don't repeat" nudge, not a correctness guarantee).
_RECENT_TITLES: Deque[str] = deque(maxlen=120)

# Scenario domains rotated per candidate so even the same underlying skill is
# framed in a fresh context each time.
_SCENARIO_DOMAINS = [
    "e-commerce / online retail", "healthcare / hospital systems", "banking & fintech",
    "logistics & delivery tracking", "social media / messaging", "video streaming",
    "ride-sharing / mobility", "IoT / smart devices", "airline & travel booking",
    "education / online learning", "gaming & leaderboards", "cybersecurity / access logs",
    "energy & utilities metering", "real-estate listings", "food delivery",
    "warehouse & inventory", "ticketing & events", "HR / payroll systems",
    "telecom call records", "agriculture / weather sensors",
]

# Textbook clichés the generator should avoid so questions feel authored, not copied.
_OVERUSED_PROBLEMS = (
    "FizzBuzz", "Two Sum", "reverse a string", "palindrome check", "Fibonacci",
    "factorial", "bubble sort", "is-prime", "Roman numerals", "valid parentheses only",
)

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
        },
        {
            "title": "Merge Two Sorted Lists",
            "tags": ["arrays", "two-pointers"],
            "problem_statement": "Write a function `merge_sorted(a, b)` that merges two already-sorted lists of integers into one sorted list, without using sorted() on the combined list.",
            "input_format": "Two ascending-sorted lists of integers `a` and `b`.",
            "output_format": "A single ascending-sorted list containing all elements of both.",
            "example_input": "a = [1, 4, 7], b = [2, 3, 8]",
            "example_output": "[1, 2, 3, 4, 7, 8]",
            "starter_code": "def merge_sorted(a, b):\n    # your code here\n    pass\n",
            "eval_points": ["Uses a two-pointer merge, not a re-sort", "Handles one list being empty or exhausted first", "Preserves duplicates"]
        },
        {
            "title": "First Non-Repeating Character",
            "tags": ["strings", "dictionaries"],
            "problem_statement": "Write a function `first_unique(s)` that returns the first character in the string that appears exactly once, or an empty string if there is none.",
            "input_format": "A string `s` of lowercase letters.",
            "output_format": "A single-character string, or '' if every character repeats.",
            "example_input": "s = 'aabbcdd'",
            "example_output": "'c'",
            "starter_code": "def first_unique(s):\n    # your code here\n    pass\n",
            "eval_points": ["Counts occurrences in one pass, then scans in order", "Returns the FIRST such character, not any", "Handles the no-unique case"]
        },
        {
            "title": "Move Zeroes to the End",
            "tags": ["arrays", "in-place"],
            "problem_statement": "Write a function `move_zeroes(nums)` that shifts every 0 in the list to the end while keeping the relative order of the non-zero elements. Return the modified list.",
            "input_format": "A list of integers `nums`.",
            "output_format": "The same list with all zeroes moved to the end.",
            "example_input": "nums = [0, 1, 0, 3, 12]",
            "example_output": "[1, 3, 12, 0, 0]",
            "starter_code": "def move_zeroes(nums):\n    # your code here\n    pass\n",
            "eval_points": ["Preserves order of non-zero values", "Does not use extra O(n) storage if avoidable", "Handles all-zero and no-zero lists"]
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
        },
        {
            "title": "Merge Overlapping Intervals",
            "tags": ["arrays", "sorting", "intervals"],
            "problem_statement": "Write a function `merge_intervals(intervals)` that merges all overlapping [start, end] intervals and returns the non-overlapping list in ascending order.",
            "input_format": "A list of [start, end] integer pairs, in any order.",
            "output_format": "A list of merged [start, end] pairs sorted by start.",
            "example_input": "intervals = [[1,3],[2,6],[8,10],[15,18]]",
            "example_output": "[[1,6],[8,10],[15,18]]",
            "starter_code": "def merge_intervals(intervals):\n    # your code here\n    pass\n",
            "eval_points": ["Sorts by start before merging", "Correctly detects overlap (next.start <= current.end)", "Extends the end to the max of the two"]
        },
        {
            "title": "Top K Frequent Elements",
            "tags": ["hashing", "heap", "sorting"],
            "problem_statement": "Write a function `top_k_frequent(nums, k)` that returns the `k` most frequently occurring values in the list, most frequent first.",
            "input_format": "A list of integers `nums` and an integer `k` (1 <= k <= number of distinct values).",
            "output_format": "A list of the `k` most frequent values, ordered by descending frequency.",
            "example_input": "nums = [1,1,1,2,2,3], k = 2",
            "example_output": "[1, 2]",
            "starter_code": "def top_k_frequent(nums, k):\n    # your code here\n    pass\n",
            "eval_points": ["Counts frequencies with a dict/Counter", "Selects the top k efficiently (heap or partial sort)", "Breaks ties in a consistent way"]
        },
        {
            "title": "Longest Substring Without Repeating Characters",
            "tags": ["strings", "sliding-window"],
            "problem_statement": "Write a function `longest_unique_substring(s)` that returns the length of the longest substring of `s` that contains no repeated character.",
            "input_format": "A string `s`.",
            "output_format": "An integer: the length of the longest substring with all distinct characters.",
            "example_input": "s = 'abcabcbb'",
            "example_output": "3",
            "starter_code": "def longest_unique_substring(s):\n    # your code here\n    pass\n",
            "eval_points": ["Uses a sliding window with a seen-set/map", "Advances the left edge past the last duplicate", "Handles empty and all-same-character strings"]
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
        },
        {
            "title": "Word Ladder Length",
            "tags": ["graph", "bfs", "strings"],
            "problem_statement": "Write a function `ladder_length(begin, end, word_list)` returning the number of words in the shortest transformation sequence from `begin` to `end`, changing one letter at a time, where every intermediate word must be in `word_list`. Return 0 if impossible.",
            "input_format": "Two equal-length lowercase words `begin` and `end`, and a list `word_list`.",
            "output_format": "An integer: the length of the shortest transformation chain (including both ends), or 0.",
            "example_input": "begin='hit', end='cog', word_list=['hot','dot','dog','lot','log','cog']",
            "example_output": "5",
            "starter_code": "def ladder_length(begin, end, word_list):\n    # your code here\n    pass\n",
            "eval_points": ["Models the problem as BFS over a word graph", "Generates neighbours by one-letter swaps efficiently", "Handles end word absent from the list"]
        },
        {
            "title": "Course Schedule (Cycle Detection)",
            "tags": ["graph", "topological-sort"],
            "problem_statement": "Write a function `can_finish(num_courses, prerequisites)` that returns True if it is possible to finish all courses given the prerequisite pairs [a, b] meaning b must be taken before a.",
            "input_format": "An integer `num_courses` and a list of [a, b] prerequisite pairs.",
            "output_format": "A boolean: True if there is no cyclic dependency, else False.",
            "example_input": "num_courses=2, prerequisites=[[1,0],[0,1]]",
            "example_output": "False",
            "starter_code": "def can_finish(num_courses, prerequisites):\n    # your code here\n    pass\n",
            "eval_points": ["Builds an adjacency list and in-degree map", "Uses Kahn's algorithm or DFS colouring for cycle detection", "Handles courses with no prerequisites"]
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
        },
        {
            "title": "Employees in a Department",
            "tags": ["select", "where", "order-by"],
            "problem_statement": "Write a SQL query that returns the `first_name` and `hire_date` of every employee in department 5, oldest hire first.",
            "input_format": "Table `employees(id, first_name, last_name, department_id, hire_date)`.",
            "output_format": "Columns `first_name`, `hire_date` filtered to department_id = 5, ordered by hire_date ascending.",
            "example_input": "employees: (1,'Ann','Lee',5,'2019-03-01'), (2,'Ben','Ng',3,'2020-01-01')",
            "example_output": "('Ann', '2019-03-01')",
            "starter_code": "-- write your SQL query here\n",
            "eval_points": ["Correct WHERE on department_id", "ORDER BY hire_date ascending", "Returns only the two requested columns"]
        },
        {
            "title": "Distinct Cities",
            "tags": ["select", "distinct"],
            "problem_statement": "Write a SQL query that returns each distinct city that appears in the suppliers table, alphabetically.",
            "input_format": "Table `suppliers(id, name, city)`.",
            "output_format": "Column `city`, distinct values, ordered A→Z.",
            "example_input": "suppliers: (1,'A','Pune'), (2,'B','Delhi'), (3,'C','Pune')",
            "example_output": "('Delhi'), ('Pune')",
            "starter_code": "-- write your SQL query here\n",
            "eval_points": ["Uses DISTINCT (or GROUP BY)", "ORDER BY city", "No duplicate rows in the result"]
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
        },
        {
            "title": "Products Never Ordered",
            "tags": ["join", "left-join", "null-filter"],
            "problem_statement": "Write a SQL query that lists the `name` of every product that has never appeared in an order.",
            "input_format": "Tables `products(id, name)` and `order_items(id, order_id, product_id, qty)`.",
            "output_format": "Column `name` for products with no matching row in order_items.",
            "example_input": "products: (1,'Pen'), (2,'Mug'); order_items: (1,10,1,3)",
            "example_output": "('Mug')",
            "starter_code": "-- write your SQL query here\n",
            "eval_points": ["LEFT JOIN products to order_items", "Filters WHERE order_items.product_id IS NULL (or NOT IN / NOT EXISTS)", "Returns only the product name"]
        },
        {
            "title": "Average Rating per Category",
            "tags": ["join", "group-by", "aggregate", "having"],
            "problem_statement": "Write a SQL query returning each category `name` and its average product rating, only for categories whose average rating is at least 4.0, highest first.",
            "input_format": "Tables `categories(id, name)` and `products(id, category_id, rating)`.",
            "output_format": "Columns `name`, `avg_rating` for categories with AVG(rating) >= 4.0, ordered descending.",
            "example_input": "categories: (1,'Books'),(2,'Toys'); products: (1,1,4.5),(2,1,4.1),(3,2,3.2)",
            "example_output": "('Books', 4.3)",
            "starter_code": "-- write your SQL query here\n",
            "eval_points": ["JOIN + GROUP BY category", "AVG(rating) with a HAVING filter (not WHERE)", "ORDER BY the average descending"]
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
        },
        {
            "title": "Second Highest Salary",
            "tags": ["subquery", "aggregate", "distinct"],
            "problem_statement": "Write a SQL query that returns the second highest distinct salary from the employees table, or NULL if there is no second distinct value.",
            "input_format": "Table `employees(id, name, salary)`.",
            "output_format": "A single value: the second highest distinct salary, or NULL.",
            "example_input": "employees: (1,'A',100),(2,'B',200),(3,'C',200)",
            "example_output": "100",
            "starter_code": "-- write your SQL query here\n",
            "eval_points": ["Considers DISTINCT salaries", "Correctly returns NULL when there is no 2nd value", "Uses a subquery / OFFSET / window function correctly"]
        },
        {
            "title": "Running Total of Daily Sales",
            "tags": ["window-functions", "aggregate"],
            "problem_statement": "Write a SQL query returning each `sale_date`, that day's `daily_total`, and the cumulative running total of sales up to and including that date, ordered by date.",
            "input_format": "Table `sales(id, sale_date, amount)`.",
            "output_format": "Columns `sale_date`, `daily_total`, `running_total`, one row per date, chronological.",
            "example_input": "sales: (1,'2024-01-01',100),(2,'2024-01-01',50),(3,'2024-01-02',200)",
            "example_output": "('2024-01-01',150,150), ('2024-01-02',200,350)",
            "starter_code": "-- write your SQL query here\n",
            "eval_points": ["Aggregates per day first", "Uses SUM(...) OVER (ORDER BY sale_date) for the running total", "Chronological ordering"]
        }
    ]
}


FALLBACK_JS_POOL = {
    "Easy": [
        {
            "title": "Sum of Even Numbers",
            "tags": ["arrays", "loops"],
            "problem_statement": "Write a function `sumEven(nums)` that returns the sum of all even numbers in an array of integers.",
            "input_format": "An array of integers `nums`.",
            "output_format": "A number: the sum of the even values (0 if there are none).",
            "example_input": "nums = [1, 2, 3, 4, 5, 6]",
            "example_output": "12",
            "starter_code": "function sumEven(nums) {\n  // your code here\n}\n",
            "eval_points": ["Correctly identifies even numbers", "Handles an empty array", "Returns a number, not a string"]
        },
        {
            "title": "Reverse Words in a Sentence",
            "tags": ["strings"],
            "problem_statement": "Write a function `reverseWords(sentence)` that returns the sentence with the order of the words reversed (single spaces, no leading/trailing space).",
            "input_format": "A string `sentence` of words separated by spaces.",
            "output_format": "A string with the words in reverse order.",
            "example_input": "sentence = 'the quick brown fox'",
            "example_output": "'fox brown quick the'",
            "starter_code": "function reverseWords(sentence) {\n  // your code here\n}\n",
            "eval_points": ["Splits and rejoins on single spaces", "Trims extra whitespace", "Does not reverse the characters within words"]
        },
        {
            "title": "Count Character Occurrences",
            "tags": ["strings", "objects"],
            "problem_statement": "Write a function `charCount(str)` that returns an object mapping each character in the string to how many times it appears.",
            "input_format": "A string `str`.",
            "output_format": "An object whose keys are characters and values are their counts.",
            "example_input": "str = 'hello'",
            "example_output": "{ h: 1, e: 1, l: 2, o: 1 }",
            "starter_code": "function charCount(str) {\n  // your code here\n}\n",
            "eval_points": ["Uses an object/Map as an accumulator", "Counts every character including repeats", "Handles the empty string"]
        }
    ],
    "Moderate": [
        {
            "title": "Group By Property",
            "tags": ["arrays", "objects", "reduce"],
            "problem_statement": "Write a function `groupBy(items, key)` that groups an array of objects into an object keyed by the value of `key`.",
            "input_format": "An array of objects `items` and a string `key` present on each object.",
            "output_format": "An object mapping each distinct key value to the array of items with that value.",
            "example_input": "items = [{type:'a',n:1},{type:'b',n:2},{type:'a',n:3}], key = 'type'",
            "example_output": "{ a: [{type:'a',n:1},{type:'a',n:3}], b: [{type:'b',n:2}] }",
            "starter_code": "function groupBy(items, key) {\n  // your code here\n}\n",
            "eval_points": ["Uses reduce or a loop with an accumulator object", "Creates the array bucket lazily", "Preserves original item order within a group"]
        },
        {
            "title": "Debounce a Function",
            "tags": ["closures", "timers"],
            "problem_statement": "Implement `debounce(fn, delay)` that returns a function which postpones calling `fn` until `delay` ms have passed since the last call.",
            "input_format": "A function `fn` and a number `delay` in milliseconds.",
            "output_format": "A new function that debounces calls to `fn`.",
            "example_input": "const d = debounce(save, 200); d(); d(); d();  // save runs once, ~200ms after the last d()",
            "example_output": "save is invoked a single time",
            "starter_code": "function debounce(fn, delay) {\n  // your code here\n}\n",
            "eval_points": ["Uses a closure to hold the timer id", "Clears the previous timer on each call", "Forwards arguments and `this` to fn"]
        },
        {
            "title": "Flatten a Nested Array",
            "tags": ["recursion", "arrays"],
            "problem_statement": "Write a function `flatten(arr)` that returns a single-level array containing every value from an arbitrarily nested array, in order.",
            "input_format": "An array `arr` that may contain numbers and/or nested arrays to any depth.",
            "output_format": "A flat array of the values in left-to-right order.",
            "example_input": "arr = [1, [2, [3, 4], 5], 6]",
            "example_output": "[1, 2, 3, 4, 5, 6]",
            "starter_code": "function flatten(arr) {\n  // your code here\n}\n",
            "eval_points": ["Handles arbitrary nesting depth (recursion or a stack)", "Uses Array.isArray to test elements", "Preserves order"]
        }
    ],
    "Hard": [
        {
            "title": "Implement a Promise-based Retry",
            "tags": ["promises", "async"],
            "problem_statement": "Implement `retry(task, times)` that calls `task` (a function returning a Promise) and, if it rejects, retries up to `times` more times before rejecting with the last error.",
            "input_format": "A function `task` returning a Promise, and an integer `times`.",
            "output_format": "A Promise that resolves with task's value, or rejects after exhausting retries.",
            "example_input": "retry(fetchFlaky, 3)  // fails twice then succeeds",
            "example_output": "resolves with fetchFlaky's eventual value",
            "starter_code": "function retry(task, times) {\n  // your code here\n}\n",
            "eval_points": ["Returns a Promise", "Retries only on rejection, stops on the first success", "Rejects with the final error after `times` attempts"]
        },
        {
            "title": "LRU Cache",
            "tags": ["design", "map"],
            "problem_statement": "Implement a class `LRUCache` with a constructor `(capacity)`, `get(key)` returning the value or -1, and `put(key, value)` evicting the least-recently-used entry when over capacity.",
            "input_format": "A sequence of get/put operations on an LRUCache of a fixed capacity.",
            "output_format": "The return values of each get call, in order.",
            "example_input": "c = new LRUCache(2); c.put(1,1); c.put(2,2); c.get(1); c.put(3,3); c.get(2)",
            "example_output": "get(1) -> 1, get(2) -> -1",
            "starter_code": "class LRUCache {\n  constructor(capacity) {\n    // your code here\n  }\n  get(key) {}\n  put(key, value) {}\n}\n",
            "eval_points": ["Uses a Map (insertion order) for O(1) operations", "Refreshes recency on get and put", "Evicts exactly one entry, only when over capacity"]
        }
    ]
}


FALLBACK_JAVA_POOL = {
    "Easy": [
        {
            "title": "Sum of Digits",
            "tags": ["math", "loops"],
            "problem_statement": "Write a method `int sumOfDigits(int n)` returning the sum of the decimal digits of a non-negative integer.",
            "input_format": "A non-negative int `n`.",
            "output_format": "An int: the sum of n's digits.",
            "example_input": "n = 1234",
            "example_output": "10",
            "starter_code": "class Solution {\n    int sumOfDigits(int n) {\n        // your code here\n        return 0;\n    }\n}\n",
            "eval_points": ["Handles n = 0", "Uses % 10 and / 10 correctly", "No string conversion needed"]
        },
        {
            "title": "Count Vowels",
            "tags": ["strings"],
            "problem_statement": "Write a method `int countVowels(String s)` that returns how many characters of `s` are vowels (a, e, i, o, u), case-insensitive.",
            "input_format": "A String `s`.",
            "output_format": "An int: the number of vowels.",
            "example_input": "s = \"Hello World\"",
            "example_output": "3",
            "starter_code": "class Solution {\n    int countVowels(String s) {\n        // your code here\n        return 0;\n    }\n}\n",
            "eval_points": ["Case-insensitive check", "Iterates every character", "Handles empty string"]
        },
        {
            "title": "Reverse an int Array In Place",
            "tags": ["arrays", "two-pointers"],
            "problem_statement": "Write a method `void reverse(int[] a)` that reverses the array in place (no new array).",
            "input_format": "An int array `a`.",
            "output_format": "The same array, elements reversed.",
            "example_input": "a = [1, 2, 3, 4, 5]",
            "example_output": "[5, 4, 3, 2, 1]",
            "starter_code": "class Solution {\n    void reverse(int[] a) {\n        // your code here\n    }\n}\n",
            "eval_points": ["Two-pointer swap", "No auxiliary array", "Handles length 0 and 1"]
        }
    ],
    "Moderate": [
        {
            "title": "First Non-Repeated Character",
            "tags": ["strings", "hashmap"],
            "problem_statement": "Write a method `char firstUnique(String s)` returning the first character that appears exactly once, or '_' if none.",
            "input_format": "A String `s` of lowercase letters.",
            "output_format": "A char: the first non-repeating character, or '_'.",
            "example_input": "s = \"aabbcdd\"",
            "example_output": "c",
            "starter_code": "class Solution {\n    char firstUnique(String s) {\n        // your code here\n        return '_';\n    }\n}\n",
            "eval_points": ["Counts with a Map or int[26]", "Second pass finds the first with count 1", "Handles the none case"]
        },
        {
            "title": "Merge Two Sorted Arrays",
            "tags": ["arrays", "two-pointers"],
            "problem_statement": "Write a method `int[] merge(int[] a, int[] b)` that merges two ascending-sorted arrays into one sorted array without calling Arrays.sort on the result.",
            "input_format": "Two ascending-sorted int arrays `a` and `b`.",
            "output_format": "A new ascending-sorted int array with all elements.",
            "example_input": "a = [1, 4, 7], b = [2, 3, 8]",
            "example_output": "[1, 2, 3, 4, 7, 8]",
            "starter_code": "class Solution {\n    int[] merge(int[] a, int[] b) {\n        // your code here\n        return new int[0];\n    }\n}\n",
            "eval_points": ["Two-pointer merge", "Copies the tail of whichever array remains", "Result length is a.length + b.length"]
        },
        {
            "title": "Group Strings by Length",
            "tags": ["collections", "map"],
            "problem_statement": "Write a method `Map<Integer, List<String>> groupByLength(List<String> words)` grouping words by their length.",
            "input_format": "A List<String> `words`.",
            "output_format": "A Map from length to the list of words of that length (input order preserved).",
            "example_input": "[\"a\", \"bb\", \"cc\", \"ddd\"]",
            "example_output": "{1=[a], 2=[bb, cc], 3=[ddd]}",
            "starter_code": "import java.util.*;\nclass Solution {\n    Map<Integer, List<String>> groupByLength(List<String> words) {\n        // your code here\n        return new HashMap<>();\n    }\n}\n",
            "eval_points": ["Uses computeIfAbsent or equivalent", "Preserves insertion order within a group", "Handles an empty list"]
        }
    ],
    "Hard": [
        {
            "title": "Valid Bracket Sequence",
            "tags": ["stack", "strings"],
            "problem_statement": "Write a method `boolean isValid(String s)` returning true if every '(', '[', '{' in `s` has a correctly-ordered matching close.",
            "input_format": "A String `s` of bracket characters.",
            "output_format": "A boolean.",
            "example_input": "s = \"{[()()]}\"",
            "example_output": "true",
            "starter_code": "class Solution {\n    boolean isValid(String s) {\n        // your code here\n        return false;\n    }\n}\n",
            "eval_points": ["Uses a Deque as a stack", "Matches bracket types, not just counts", "Handles leftover opens and stray closes"]
        },
        {
            "title": "LRU Cache",
            "tags": ["design", "linkedhashmap"],
            "problem_statement": "Implement class `LRUCache` with `LRUCache(int capacity)`, `int get(int key)` (value or -1, marks recently used) and `void put(int key, int value)` (evicts the least-recently-used when over capacity).",
            "input_format": "A sequence of get/put calls on an LRUCache of fixed capacity.",
            "output_format": "The return value of each get, in order.",
            "example_input": "LRUCache c = new LRUCache(2); c.put(1,1); c.put(2,2); c.get(1); c.put(3,3); c.get(2)",
            "example_output": "get(1) -> 1, get(2) -> -1",
            "starter_code": "import java.util.*;\nclass LRUCache {\n    LRUCache(int capacity) {\n        // your code here\n    }\n    int get(int key) { return -1; }\n    void put(int key, int value) { }\n}\n",
            "eval_points": ["LinkedHashMap access-order, or map + doubly linked list, for O(1)", "Refreshes recency on get and put", "Evicts only when strictly over capacity"]
        }
    ]
}


# Role keyword -> primary coding language. Checked against the target role first,
# then the JD, then the resume. Order matters: earlier, more specific entries win.
_ROLE_LANGUAGE_RULES: List[tuple] = [
    (("data analyst", "business analyst", "bi analyst", "business intelligence",
      "reporting analyst", "reporting specialist", "database administrator", " dba",
      "data warehouse", "analytics analyst", "insights analyst",
      "sql developer", "database developer", "etl developer", "pl/sql", "t-sql"), "SQL"),
    (("machine learning", "ml engineer", "ai engineer", "data scientist",
      "deep learning", "nlp engineer", "computer vision", "research scientist",
      "applied scientist"), "Python"),
    (("frontend", "front end", "front-end", "react developer", "angular developer",
      "vue developer", "ui engineer", "ui developer"), "JavaScript"),
    (("android",), "Kotlin"),
    (("ios developer", "ios engineer", "swift developer"), "Swift"),
    (("devops", "sre", "site reliability", "platform engineer", "infrastructure engineer",
      "cloud engineer"), "Python"),
    (("embedded", "firmware"), "C++"),
    (("game developer", "gameplay", "unreal", "unity developer"), "C#"),
]

# The language's OWN name as it appears in a résumé — a direct, high-confidence
# signal (weight 3). Kept deliberately tight; short/ambiguous tokens ("go", "r",
# "c") are matched only via unambiguous forms in _LANGUAGE_ECOSYSTEM.
_LANGUAGE_NAME_TOKENS: Dict[str, tuple] = {
    "Python": ("python",),
    "JavaScript": ("javascript",),
    "TypeScript": ("typescript",),
    "Java": ("java",),          # 'javascript' is stripped before counting, see below
    "C#": ("c#", "c sharp"),
    "C++": ("c++", "cpp"),
    "Go": ("golang",),
    "Ruby": (" ruby",),
    "PHP": ("php",),
    "Kotlin": ("kotlin",),
    "Swift": ("swift",),
    "Scala": ("scala",),
    "Rust": (" rust",),
    "SQL": ("sql",),
}

# Frameworks / ecosystem tokens that imply a language (weight 1).
_LANGUAGE_ECOSYSTEM: Dict[str, tuple] = {
    "Python": ("django", "flask", "fastapi", "pandas", "numpy", "pytorch", "pyspark"),
    "JavaScript": ("node.js", "nodejs", "react", "angular", "vue", "express", "next.js", "redux"),
    "TypeScript": ("nestjs",),
    "Java": ("spring", "spring boot", "hibernate", "j2ee", "micronaut", "quarkus"),
    "C#": (".net", "asp.net", "dotnet", "blazor"),
    "Go": ("gin framework", "gorm"),
    "Ruby": ("rails",),
    "PHP": ("laravel", "symfony"),
    "SQL": ("t-sql", "pl/sql", "stored procedure", "ssis", "ssrs", "informatica",
            "snowflake", "redshift", "bigquery", "dimensional model"),
}

# Back-compat: some code/tests still import _LANGUAGE_SIGNALS.
_LANGUAGE_SIGNALS: Dict[str, tuple] = {
    lang: _LANGUAGE_NAME_TOKENS.get(lang, ()) + _LANGUAGE_ECOSYSTEM.get(lang, ())
    for lang in set(_LANGUAGE_NAME_TOKENS) | set(_LANGUAGE_ECOSYSTEM)
}


# Exact skill-string -> language, for short/ambiguous language names that are
# unsafe as substrings ("go" in "google", "r" everywhere) but unambiguous when a
# résumé lists them as a discrete skill.
_SKILL_EXACT_LANGUAGE: Dict[str, str] = {
    "go": "Go", "golang": "Go",
    "r": "R", "c": "C", "c language": "C",
    "rust": "Rust", "scala": "Scala", "kotlin": "Kotlin", "swift": "Swift",
    "dart": "Dart", "elixir": "Elixir", "perl": "Perl", "haskell": "Haskell",
    "objective-c": "Objective-C", "objective c": "Objective-C", "matlab": "MATLAB",
    "bash": "Bash", "shell": "Bash", "shell scripting": "Bash",
}


def _language_of_skill(skill: str) -> Optional[str]:
    """Map a single résumé skill string to a language, if it clearly names one
    (or that language's flagship framework)."""
    raw = skill.strip().lower()
    if raw in _SKILL_EXACT_LANGUAGE:
        return _SKILL_EXACT_LANGUAGE[raw]
    s = f" {raw} "
    for lang, tokens in _LANGUAGE_NAME_TOKENS.items():
        if lang == "Java" and "javascript" in s:
            continue
        if any(t.strip() and t in s for t in tokens):
            return lang
    for lang, tokens in _LANGUAGE_ECOSYSTEM.items():
        if any(t in s for t in tokens):
            return lang
    return None

# "This resume is clearly a software builder" signals — used to override a
# mis-parsed analyst/BI job title on a résumé that is really a developer's.
_SOFTWARE_BUILDER_SIGNALS = (
    "django", "flask", "fastapi", "spring boot", " spring ", "express", "node.js", "nodejs",
    "react", "angular", "vue", "asp.net", ".net core", "laravel", "rails on",
    "microservices", "full stack", "full-stack", "backend developer", "back-end developer",
    "software engineer", "software developer",
)


def _score_languages(resume_text: str, jd_text: str, skills: Optional[List[str]] = None) -> Dict[str, float]:
    """Weighted language score from the résumé + JD + the ordered skills list.

    * the language's own name in the text  -> +3 each occurrence
    * a framework/ecosystem token          -> +1 each occurrence
    * position in the ordered ``skills``   -> first listed language +6, then
      +5, +4 … (a résumé lists its strongest skill first, so the FIRST
      programming language on it is the "main" one)
    """
    resume = (resume_text or "").lower()
    jd = (jd_text or "").lower()
    blob = f"{resume}\n{jd}"
    # 'javascript' contains 'java' — don't let it inflate the Java score.
    blob_no_js = blob.replace("javascript", "  ")

    scores: Dict[str, float] = {}
    for lang, tokens in _LANGUAGE_NAME_TOKENS.items():
        text = blob_no_js if lang == "Java" else blob
        scores[lang] = scores.get(lang, 0.0) + 3.0 * sum(text.count(t) for t in tokens)
    for lang, tokens in _LANGUAGE_ECOSYSTEM.items():
        scores[lang] = scores.get(lang, 0.0) + 1.0 * sum(blob.count(t) for t in tokens)

    for i, skill in enumerate(skills or []):
        lang = _language_of_skill(str(skill))
        if lang:
            scores[lang] = scores.get(lang, 0.0) + max(6.0 - i, 1.0)

    return scores


def _resolve_primary_language(
    resume_text: str, jd_text: str, target_role: str, skills: Optional[List[str]] = None
) -> tuple:
    """Deterministically decide the ONE language the coding round tests: the role
    (primary signal) with a résumé/JD/skills tiebreak for generic roles like
    "Full Stack Developer" or "Software Engineer".

    Returns ``(language, reason)``. Computed server-side and handed to the LLM as
    an already-made decision (small models over-index on SQL because every dev
    résumé mentions a database).
    """
    role = (target_role or "").strip().lower()
    blob = f"{(resume_text or '').lower()}\n{(jd_text or '').lower()}"

    # 1. Explicit role match.
    for keywords, language in _ROLE_LANGUAGE_RULES:
        hit = next((k for k in keywords if k.strip() and k in role), None)
        if hit:
            # Guard: an "analyst/BI" job title on an obviously software-building
            # resume is a mis-parse — treat as a developer instead.
            if language == "SQL" and any(s in blob for s in _SOFTWARE_BUILDER_SIGNALS):
                break
            return language, f"role matched '{hit.strip()}'"

    # 2. Generic dev role (or unknown) -> the résumé's main language.
    scores = _score_languages(resume_text, jd_text, skills)
    # SQL alone should never win a generic *developer* round — it's a supporting
    # skill there, not the coding language.
    ranked = sorted(
        ((s, l) for l, s in scores.items() if s > 0 and l != "SQL"),
        reverse=True,
    )
    if ranked:
        top_score, best = ranked[0]
        return best, f"résumé's main language is {best} (score {top_score:g})"

    # 3. Nothing to go on.
    return "Python", "default (no strong role or résumé language signal)"


# Roles that are genuinely BOTH languages — the round is a deliberate mix, not a
# single language. Each entry: (role keywords, 5-slot plan aligned to
# DIFFICULTY_SEQUENCE (E, E, M, M, H), human reason).
_ROLE_LANGUAGE_PLANS: List[Tuple[tuple, List[str], str]] = [
    (("data analyst", "business analyst", "bi analyst", "business intelligence",
      "reporting analyst", "reporting specialist", "analytics analyst",
      "insights analyst", "data analytics", "data analysis", "product analyst",
      "marketing analyst", "operations analyst"),
     ["SQL", "SQL", "SQL", "Python", "Python"],
     "data-analysis role — SQL querying + Python (pandas) data wrangling"),
    (("data engineer", "analytics engineer", "etl developer", "etl engineer"),
     ["SQL", "SQL", "Python", "Python", "Python"],
     "data-engineering role — SQL modelling + Python pipelines"),
]


def _resolve_language_plan(
    resume_text: str,
    jd_text: str,
    target_role: str,
    role_is_explicit: bool = False,
    skills: Optional[List[str]] = None,
) -> Tuple[List[str], str, Optional[str], str]:
    """Decide the language of EACH of the 5 questions.

    Returns ``(plan, primary_language, secondary_language, reason)`` where ``plan``
    is a list of 5 language names aligned to :data:`DIFFICULTY_SEQUENCE`.

    * Data-analysis / data-engineering roles get an intentional **SQL + Python**
      mix — those jobs are both, so the round is both.
    * A Data Scientist / ML role whose résumé clearly shows SQL gets mostly
      Python with one SQL query.
    * Every other role (Full Stack, Backend, Software Engineer, …) is tested on
      the **main programming language on the résumé** — e.g. a Full Stack
      Developer résumé built around Java + Spring gets a Java round — decided by
      :func:`_resolve_primary_language` from the ordered ``skills`` list and the
      résumé text.

    ``role_is_explicit`` means the candidate hand-picked the role (not auto-parsed
    from the résumé); when set, the "analyst title on a dev résumé is a mis-parse"
    guard is skipped — the candidate's choice wins.
    """
    role = (target_role or "").strip().lower()
    resume = (resume_text or "").lower()
    jd = (jd_text or "").lower()
    blob = f"{resume}\n{jd}"
    looks_like_builder = (not role_is_explicit) and any(s in blob for s in _SOFTWARE_BUILDER_SIGNALS)

    # 1. Explicit mixed-language role.
    for keywords, plan, reason in _ROLE_LANGUAGE_PLANS:
        hit = next((k for k in keywords if k in role), None)
        if hit:
            # Mis-parse guard: an auto-detected "analyst" title on an obviously
            # software-building résumé is a developer — fall through to step 3.
            if looks_like_builder:
                break
            primary = Counter(plan).most_common(1)[0][0]
            secondary = next((l for l in plan if l != primary), None)
            return list(plan), primary, secondary, f"{reason} (role matched '{hit.strip()}')"

    # 2. Data Scientist / ML with real SQL evidence -> Python-heavy + 1 SQL.
    ds_role = any(k in role for k in (
        "data scientist", "machine learning", "ml engineer", "ai engineer", "applied scientist"
    ))
    sql_evidence = any(s in blob for s in (
        "sql", "postgres", "mysql", "bigquery", "snowflake", "redshift", "t-sql", "pl/sql"
    ))
    if ds_role and sql_evidence and not looks_like_builder:
        return (
            ["Python", "Python", "Python", "Python", "SQL"], "Python", "SQL",
            "data-science role with SQL on the résumé — Python (4) + one SQL query (1)",
        )

    # 3. Single language — the résumé's main programming language.
    lang, reason = _resolve_primary_language(resume_text, jd_text, target_role, skills)
    return [lang] * 5, lang, None, reason


def _plan_summary(plan: List[str]) -> str:
    """'3 SQL + 2 Python' style label for a plan."""
    counts = Counter(plan)
    return " + ".join(f"{n} {lang}" for lang, n in counts.most_common())


def _pick_fallback_pool(primary_language: str) -> Dict[str, List[Dict[str, Any]]]:
    lang = (primary_language or "").strip().lower()
    if "sql" in lang or "database" in lang:
        return FALLBACK_SQL_POOL
    if any(k in lang for k in ("javascript", "typescript", "node", " js")):
        return FALLBACK_JS_POOL
    if lang in ("java", "kotlin", "scala"):  # JVM languages — Java pool is the closest offline fit
        return FALLBACK_JAVA_POOL
    return FALLBACK_PYTHON_POOL


def _pool_language(pool: Dict[str, List[Dict[str, Any]]]) -> str:
    return (
        "SQL" if pool is FALLBACK_SQL_POOL
        else "JavaScript" if pool is FALLBACK_JS_POOL
        else "Java" if pool is FALLBACK_JAVA_POOL
        else "Python"
    )


def _build_random_fallback(
    plan: List[str], avoid_titles: Optional[set] = None
) -> Tuple[List[Dict[str, Any]], List[str]]:
    """Sample a per-slot set from the offline pools following ``plan`` (one
    language per question), with no repeats inside the round and a preference for
    questions this process hasn't handed out recently.

    Returns ``(questions, effective_plan)`` — ``effective_plan`` is the language
    actually served for each slot (a pool the process ships; e.g. a "Kotlin"
    slot falls back to the Python pool and is labelled Python).
    """
    avoid = {t.lower() for t in (avoid_titles or set())}
    avoid |= {t.lower() for t in list(_RECENT_TITLES)[-10:]}
    used: set = set()
    picks: List[Dict[str, Any]] = []
    effective: List[str] = []

    for idx, difficulty in enumerate(DIFFICULTY_SEQUENCE):
        want_lang = plan[idx] if idx < len(plan) else plan[-1]
        pool = _pick_fallback_pool(want_lang)
        bucket = [q for q in pool.get(difficulty, []) if q.get("title", "").lower() not in used]
        random.shuffle(bucket)
        ordered = [q for q in bucket if q["title"].lower() not in avoid] + \
                  [q for q in bucket if q["title"].lower() in avoid]
        if not ordered:  # this difficulty exhausted for this language — take any
            ordered = [q for b in pool.values() for q in b if q.get("title", "").lower() not in used] \
                      or [q for b in pool.values() for q in b]
        chosen = dict(ordered[0])
        picks.append(chosen)
        effective.append(_pool_language(pool))
        used.add(chosen["title"].lower())

    return picks, effective


def _remember_titles(questions: List[Dict[str, Any]]) -> None:
    """Record the titles just handed out so the next candidate's set differs."""
    for q in questions:
        t = (q.get("title") or "").strip()
        if t:
            _RECENT_TITLES.append(t)


def _guess_primary_language(resume_text: str, jd_text: str, target_role: str) -> str:
    """Back-compat shim — delegates to :func:`_resolve_primary_language`."""
    return _resolve_primary_language(resume_text, jd_text or "", target_role or "")[0]


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


def _finalize_questions(questions: List[Dict[str, Any]], plan: List[str]) -> List[Dict[str, Any]]:
    """Normalize a 5-question list: enforce ids, difficulty sequence, the assigned
    per-question language and required fields."""
    final = []
    for idx, q in enumerate(questions[:5]):
        q = dict(q)
        q["id"] = idx + 1
        q["difficulty"] = DIFFICULTY_SEQUENCE[idx]
        q["language"] = (plan[idx] if idx < len(plan) else plan[-1]).lower()
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
    api_key: Optional[str] = None,
    avoid_titles: Optional[List[str]] = None,
    role_is_explicit: bool = False,
    skills: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Generates a 5-question hands-on coding round tailored to the candidate's
    résumé and target role: 2 Easy, 2 Moderate, 1 Hard.

    The language of each question is decided **server-side** by
    :func:`_resolve_language_plan` from the target role (primary signal) with a
    résumé/JD keyword tiebreak:

    * Data Analyst / BI / Reporting  -> **SQL + Python mix** (3 SQL + 2 pandas)
    * Data Engineer / Analytics Eng. -> **SQL + Python mix** (2 SQL + 3 Python)
    * Data Scientist / ML w/ SQL     -> Python (4) + one SQL query
    * Data Scientist / ML            -> Python
    * Frontend / React / UI          -> JavaScript
    * generic Software / Backend / Full Stack -> the language the résumé emphasises
    * fallback                       -> Python

    The plan is handed to the LLM as a fixed per-question constraint (the model
    is NOT asked to infer it — small models over-index on SQL whenever a
    developer résumé mentions a database), and every returned question is forced
    back onto its assigned language.
    """
    client = get_openai_client(api_key)
    role_ctx = target_role or "Software Engineer"

    plan, primary_language, secondary_language, lang_reason = _resolve_language_plan(
        resume_text or "", jd_text or "", target_role or "",
        role_is_explicit=role_is_explicit, skills=skills,
    )
    is_mixed = len(set(plan)) > 1

    # ── per-candidate uniqueness knobs ────────────────────────────────────────
    nonce = uuid.uuid4().hex                       # unique every call, no collisions
    domain = random.choice(_SCENARIO_DOMAINS)      # rotate the framing each time
    seed_line = f"{nonce}:{(candidate_name or 'candidate')}:{role_ctx}:{time.time_ns()}"
    avoid = list(dict.fromkeys(  # recent titles this candidate + this process saw
        [t for t in (avoid_titles or []) if t]
        + [t for t in _RECENT_TITLES]
    ))[:40]
    avoid_block = (
        "Do NOT reuse any of these recently-used problem titles or their close variants:\n"
        + "\n".join(f"- {t}" for t in avoid)
        if avoid else
        "There is no prior-questions list — just make them original."
    )

    # ── STEP 1 block: the per-question language plan (already decided) ────────
    if is_mixed:
        per_q = "\n".join(
            f"- Question {i + 1} ({DIFFICULTY_SEQUENCE[i]}): **{plan[i]}**" for i in range(5)
        )
        focus_block = f"""STEP 1 — Language of each question (ALREADY DECIDED — follow exactly, this is a deliberate {_plan_summary(plan)} mix):
{per_q}
Why this mix: {lang_reason}.
- For every SQL question: pose a REAL query task — put a small example table schema in `input_format` and expect SELECT / JOIN / GROUP BY / aggregates / subqueries / window functions as appropriate to the difficulty. `starter_code` is "-- write your SQL query here".
- For every Python question: pose a hands-on data task — lists / dicts / strings / and pandas-style DataFrame wrangling (filter, group, aggregate, merge, reshape). NOT SQL. `starter_code` is a `def ...:` stub.
- Each question's "language" field MUST equal its assigned language, lowercased ("sql" or "python")."""
    else:
        lang = plan[0]
        is_sql = lang.strip().lower() == "sql"
        focus_block = f"""STEP 1 — Coding focus (ALREADY DECIDED — do not change it):
The language for ALL 5 questions is **{lang}** (chosen because: {lang_reason}).
Every question's "language" field MUST be "{lang.lower()}".
{'Write REAL SQL queries: SELECT / JOIN / GROUP BY / aggregates / subqueries / window functions, with a small example table schema in `input_format`.' if is_sql else f'Do NOT write SQL questions at all — an application that merely stores its data in a SQL database does not make this a SQL round. Prefer practical {lang} problems: data structures, strings, loops, simple algorithms, small design tasks.'}"""

    prompt = f"""You are an expert technical interviewer designing a hands-on coding round.

Candidate: {candidate_name or "Candidate"}
Candidate Target Role: {role_ctx}

Candidate Resume:
{(resume_text or "No resume text provided.")[:4000]}

Job Description (if any):
{(jd_text or "Not provided.")[:2000]}

UNIQUENESS — this must be a fresh set, different from every other candidate:
- Unique generation id: {seed_line}
- Frame the problems around this scenario domain: **{domain}** (use it for the story/variables/table names, not as a topic to test).
- Invent new problems with new numbers, names and scenarios every time — even for an identical resume, two runs must not overlap.
- Avoid over-used textbook problems: {", ".join(_OVERUSED_PROBLEMS)}.
- {avoid_block}

{focus_block}

STEP 2 — Write exactly 5 original, hands-on coding problems (NOT multiple choice, NOT trivia — the candidate must write real code/query to solve each one), in the order Easy, Easy, Moderate, Moderate, Hard.
Give 2-3 short topic tags per question (e.g. ["arrays","hashing"] or ["join","group-by"]). Provide `starter_code` as a valid stub in that question's assigned language. Keep problems grounded in the candidate's résumé and target role.

Return ONLY valid JSON matching this schema:
{{
  "primary_language": "Python",
  "secondary_language": null,
  "questions": [
    {{
      "id": 1,
      "title": "Short descriptive title 1",
      "language": "python",
      "difficulty": "Easy",
      "tags": ["arrays", "loops"],
      "problem_statement": "The core problem description (1-3 sentences).",
      "input_format": "What the input consists of (for SQL: describe the table schema here).",
      "output_format": "What the output/result should be.",
      "example_input": "A concrete example input value or sample rows.",
      "example_output": "The expected output for that example.",
      "starter_code": "def function_name(args):\\n    # your code here\\n    pass\\n",
      "eval_points": ["What a correct, well-written solution must do", "Another key thing to check for"]
    }},
    {{
      "id": 2,
      "title": "Short descriptive title 2",
      "language": "python",
      "difficulty": "Easy",
      "tags": ["strings"],
      "problem_statement": "Second problem description.",
      "input_format": "Input format.",
      "output_format": "Output format.",
      "example_input": "Sample input.",
      "example_output": "Sample output.",
      "starter_code": "def function2(args):\\n    # your code here\\n    pass\\n",
      "eval_points": ["Criteria"]
    }}
  ]
}}
"""

    try:
        model_name = os.getenv("CODING_GROQ_MODEL", "openai/gpt-oss-120b")
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert technical interview question designer. You must output ONLY "
                        "a single valid JSON object containing all 5 questions in the 'questions' array. "
                        "No markdown wrapping, no text outside the JSON."
                    ),
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4096,
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        questions = data.get("questions", [])

        if len(questions) < 5:
            raise ValueError(f"LLM returned {len(questions)} questions instead of 5")

        # The plan was decided server-side — force each question onto its assigned
        # language so a model that drifts (e.g. back to SQL) can't leak through.
        final_questions = _finalize_questions(questions, plan)
        _remember_titles(final_questions)

        return {
            "status": "success",
            "primary_language": primary_language,
            "secondary_language": secondary_language,
            "language_plan": list(plan),
            "language_summary": _plan_summary(plan),
            "is_mixed": is_mixed,
            "language_reason": lang_reason,
            "total_questions": len(final_questions),
            "questions": final_questions,
        }

    except Exception as e:
        safe_msg = str(e).encode("ascii", errors="replace").decode("ascii")
        print(f"Error generating coding round questions: {safe_msg}. Using fallback question pool.")
        # Offline pools exist only for Python / SQL / JavaScript; any other
        # planned language degrades to the Python pool. `_build_random_fallback`
        # returns the language actually served per slot so labels stay honest.
        fallback, effective_plan = _build_random_fallback(plan, set(avoid_titles or []))
        fallback = _finalize_questions(fallback, effective_plan)
        _remember_titles(fallback)
        eff_primary = Counter(effective_plan).most_common(1)[0][0]
        eff_secondary = next((l for l in effective_plan if l != eff_primary), None)
        return {
            "status": "success",
            "primary_language": eff_primary,
            "secondary_language": eff_secondary,
            "language_plan": effective_plan,
            "language_summary": _plan_summary(effective_plan),
            "is_mixed": len(set(effective_plan)) > 1,
            "language_reason": f"{lang_reason}; offline fallback pool",
            "total_questions": len(fallback),
            "questions": fallback,
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
  "summary": "3-4 sentence overall summary of the candidate's coding round performance, naming the language(s) tested and how they did in each.",
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
