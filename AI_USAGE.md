# AI Usage & Collaboration Log (AI_USAGE.md)

This document outlines how AI tools were utilized during the development of EquiSplit, key prompts used to guide the architecture, and critical instances where AI-generated output required human intervention, critical thinking, and correction.

## AI Tools Used
- **Primary Collaborator:** Antigravity (Google DeepMind) / LLM Coding Assistant
- **Roles:** Project scaffolding, boilerplate generation, algorithm drafting, Tailwind CSS component creation, and initial database schema drafting.

## Key Prompts Used
1. *"Design a strict relational database schema (PostgreSQL) for a shared expenses app. It must handle multi-currency expenses with exchange rates, time-bound group memberships (users joining/leaving at specific dates), and include a staging area (`ImportBatches`, `ImportAnomalies`) for messy CSV data imports."*
2. *"Write a debt simplification algorithm in Python that takes a list of bilateral debts (A owes B $10, B owes C $20) and returns the minimum number of transactions required to settle all balances. Handle floating-point precision issues carefully."*
3. *"Generate a Next.js React component using Tailwind CSS for an 'Import Review Dashboard'. It needs to display a list of data anomalies (e.g., 'Negative Amount Detected') and provide the user with explicit dropdown options to select a resolution policy (Merge, Delete, Keep)."*

---

## AI Corrections & Human Oversight

As requested in the assignment, while the AI is a powerful accelerator, the human engineer remains responsible for every line of code. Here are three concrete cases where the AI produced incorrect, sub-optimal, or requirement-violating code, how it was caught, and how it was fixed.

### Case 1: Silent Failures in Data Import (Violating Meera's Requirement)
*   **The Error:** During the implementation of the CSV parsing logic, I asked the AI to handle invalid data types (e.g., a string in an amount column) and negative amounts. The AI generated code that used a `try-except` block to catch the `ValueError` and simply `continue` to the next row, silently dropping the bad data.
*   **How I Caught It:** During manual code review of the `import_service.py` file, I noticed the silent `continue`. This directly violated the core assignment requirement ("A silent guess is a failing answer") and Meera's explicit request to approve anything the app deletes.
*   **What I Changed:** I rejected the AI's logic and rewrote the ingestion loop. Instead of skipping rows, the parser now catches the error and creates an `ImportAnomaly` record in the database. This record preserves the raw JSON row data and flags the specific error type. This ensures the frontend can query these records and present them in the interactive dashboard for explicit user resolution.

### Case 2: Flawed Time-Bound Membership Model (Violating Sam's Requirement)
*   **The Error:** To satisfy Sam's requirement ("I moved in mid-April. Why would March electricity affect my balance?"), I asked the AI to update the database schema to handle dynamic group memberships. The AI added a simple `is_active` boolean column to the `GroupMemberships` table.
*   **How I Caught It:** I realized during the architectural review that a boolean flag only reflects the *current* state of the user. If a user enters a historical expense from March, the system needs to know who was active *in March*, not who is active *today*. A boolean flag cannot answer temporal queries.
*   **What I Changed:** I corrected the schema design manually. I removed the `is_active` boolean and replaced it with `joined_at` and `left_at` `Date` columns. I then updated the expense splitting logic to filter users based on whether the `expense.date` falls strictly between their specific `joined_at` and `left_at` bounds.

### Case 3: Naive Debt Simplification (Violating Aisha's Requirement)
*   **The Error:** When asked to implement the debt simplification algorithm ("one number per person"), the AI initially provided a naive greedy algorithm. While it worked for simple linear chains, it failed to identify and eliminate circular debts (e.g., A owes B $10, B owes C $10, C owes A $10).
*   **How I Caught It:** I did not trust the AI's algorithm blindly. I wrote a suite of `pytest` unit tests specifically targeting edge cases in debt graphs, including circular dependencies. The AI's initial implementation returned three unnecessary transactions instead of simplifying the circular debt to zero.
*   **What I Changed:** I discarded the naive approach. I guided the AI to implement a more robust algorithm (similar to the standard Splitwise algorithm) that first calculates the absolute net balances for every user, separates them into lists of net-debtors and net-creditors, and then matches the largest debtors with the largest creditors iteratively until all net balances are zero. This correctly passed all unit test edge cases.
