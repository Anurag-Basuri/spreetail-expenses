# Scope & Anomaly Log (SCOPE.md)

## Section 1: Anomaly Log

Below is the log of the 22 anomalies detected during the ingestion of `expenses_export.csv`. Each entry details the raw problem, our detection logic, the applied resolution policy (often requiring explicit user approval via the Interactive Dashboard), and the final database state.

### 1. Exact duplicate
*   **Row number:** 5-6
*   **What the problem is:** "Dinner at Marina Bites" and "dinner - marina bites" — same date, same amount, same payer, same split. Exact duplicate.
*   **How your importer detects it:** `DUPLICATE` anomaly checks for same date, normalized description, amount, and payer.
*   **What policy you applied:** Flagged in UI. User selects "Merge into One".
*   **What ends up in the database:** Only a single `Expenses` record is created.

### 2. Malformed data
*   **Row number:** 7
*   **What the problem is:** amount = "1,200" — comma inside the number breaks numeric parsing.
*   **How your importer detects it:** `MALFORMED_AMOUNT` detects commas in string.
*   **What policy you applied:** Auto-fixed by stripping commas.
*   **What ends up in the database:** `1200` stored in `Expenses`.

### 3. Name inconsistency (Lowercase)
*   **Row number:** 9
*   **What the problem is:** paid_by = "priya" — lowercase, doesn't match "Priya".
*   **How your importer detects it:** `NAME_INCONSISTENCY` detects a fuzzy match (titlecasing).
*   **What policy you applied:** Auto-fixed to "Priya".
*   **What ends up in the database:** Mapped to Priya's user ID.

### 4. Name inconsistency (Extra Initial)
*   **Row number:** 11
*   **What the problem is:** paid_by = "Priya S" — extra surname initial, doesn't match "Priya".
*   **How your importer detects it:** `NAME_INCONSISTENCY` via fuzzy string prefix matching.
*   **What policy you applied:** Auto-fixed to "Priya".
*   **What ends up in the database:** Mapped to Priya's user ID.

### 5. Rounding / Excess Decimals
*   **Row number:** 10
*   **What the problem is:** amount = 899.995 — three decimal places, rounding policy unclear.
*   **How your importer detects it:** `EXCESS_DECIMALS` anomaly triggers if places > 2.
*   **What policy you applied:** Auto-fixed to 900.00 using standard `ROUND_HALF_UP`.
*   **What ends up in the database:** `900.00` in `Expenses`.

### 6. Missing field (paid_by)
*   **Row number:** 13
*   **What the problem is:** paid_by = "" — House cleaning supplies has NO payer.
*   **How your importer detects it:** `MISSING_PAYER` string emptiness check.
*   **What policy you applied:** Hard Flag. User forced to select a payer.
*   **What ends up in the database:** `Expenses` record created with selected `payer_id`.

### 7. Settlement as expense (Rohan paid Aisha back)
*   **Row number:** 14
*   **What the problem is:** "Rohan paid Aisha back" — no split_type, note says "this is a settlement not an expense". Logged as an expense.
*   **How your importer detects it:** `SETTLEMENT_AS_EXPENSE` keyword detection in description.
*   **What policy you applied:** Flagged/Auto-fixed to convert to `Settlements` table.
*   **What ends up in the database:** Inserted into the `Settlements` table.

### 8. Invalid percentages
*   **Row number:** 15
*   **What the problem is:** Pizza Friday percentages: 30+30+30+20 = 110%, not 100%. Invalid split.
*   **How your importer detects it:** `INVALID_PERCENTAGES` using regex extraction of %s.
*   **What policy you applied:** Flagged. User must adjust percentages.
*   **What ends up in the database:** `ExpenseSplits` created using adjusted percentages.

### 9. Date format chaos
*   **Row number:** 16–34
*   **What the problem is:** Date formats are completely inconsistent: 2026-02-01, 01/03/2026, 03/03/2026, Mar 14, 04/05/2026.
*   **How your importer detects it:** Handled by standard `date_parser`. Throws various warnings.
*   **What policy you applied:** Regex parser dynamically converts standard EU/US formats to ISO.
*   **What ends up in the database:** Clean `YYYY-MM-DD` representation.

### 10. Unknown member
*   **Row number:** 23
*   **What the problem is:** Parasailing split includes "Dev's friend Kabir" — NOT a registered member of the group.
*   **How your importer detects it:** `UNKNOWN_PARTICIPANT` fails name matching.
*   **What policy you applied:** Flagged. User maps to Dev or creates user.
*   **What ends up in the database:** `ExpenseSplits` maps to the designated user ID.

### 11. Near-duplicate conflict
*   **Row number:** 24–25
*   **What the problem is:** "Dinner at Thalassa" (Aisha, ₹2400) AND "Thalassa dinner" (Rohan, ₹2450) — same dinner, two entries, different amounts, different payers. Which one wins?
*   **How your importer detects it:** `NEAR_DUPLICATE` checks keyword intersections.
*   **What policy you applied:** Flagged. User selects one row to reject and one to approve.
*   **What ends up in the database:** Only the approved row makes it to `Expenses`.

### 12. Negative amount
*   **Row number:** 26
*   **What the problem is:** amount = -30 USD (Parasailing refund) — negative amount. Refund or error?
*   **How your importer detects it:** `NEGATIVE_AMOUNT` logic check < 0.
*   **What policy you applied:** Flagged. User verifies.
*   **What ends up in the database:** Inserted into `Expenses` with negative total.

### 13. Ambiguous date (Incomplete)
*   **Row number:** 27
*   **What the problem is:** date = "Mar 14" — no year, no day ordinal zero-pad.
*   **How your importer detects it:** `AMBIGUOUS_DATE` (Incomplete date) via date parser regex `Month DD`.
*   **What policy you applied:** Auto-fixed by filling in the context year (2026).
*   **What ends up in the database:** `2026-03-14`.

### 14. Name whitespace
*   **Row number:** 27
*   **What the problem is:** paid_by = "rohan " — trailing space. Doesn't match "Rohan".
*   **How your importer detects it:** `NAME_INCONSISTENCY` normalization check.
*   **What policy you applied:** Auto-fixed.
*   **What ends up in the database:** Mapped to Rohan's user ID.

### 15. Missing currency
*   **Row number:** 28
*   **What the problem is:** currency = "" — Groceries DMart has no currency.
*   **How your importer detects it:** `MISSING_CURRENCY` check.
*   **What policy you applied:** Auto-fixed to INR.
*   **What ends up in the database:** `INR`.

### 16. Whitespace in amount
*   **Row number:** 29
*   **What the problem is:** amount = " 1450 " — leading and trailing whitespace inside the amount field.
*   **How your importer detects it:** `WHITESPACE_IN_AMOUNT` length delta check.
*   **What policy you applied:** Auto-fixed.
*   **What ends up in the database:** Decimal `1450.00`.

### 17. Zero-amount expense
*   **Row number:** 31
*   **What the problem is:** amount = 0 — Swiggy order is zero, note says "counted twice earlier".
*   **How your importer detects it:** `ZERO_AMOUNT` logic check.
*   **What policy you applied:** Flagged as ERROR to either drop or provide amount.
*   **What ends up in the database:** Dropped if user chooses reject.

### 18. Ambiguous date format
*   **Row number:** 34
*   **What the problem is:** date = "04/05/2026" — ambiguous. Is it April 5 (DD/MM) or May 4 (MM/DD)?
*   **How your importer detects it:** `AMBIGUOUS_DATE` flags dates where day < 12 and month < 12.
*   **What policy you applied:** Flagged/Auto-fixed depending on context. Default DD/MM in India context.
*   **What ends up in the database:** `2026-05-04`.

### 19. Inactive member in split
*   **Row number:** 36
*   **What the problem is:** April 2 groceries split includes Meera, who moved out end of March.
*   **How your importer detects it:** `INACTIVE_MEMBER` checks `expense_date` against `GroupMemberships.left_at`.
*   **What policy you applied:** Flagged. User drops Meera from split.
*   **What ends up in the database:** No `ExpenseSplits` row for Meera.

### 20. Settlement as expense (Sam deposit)
*   **Row number:** 38
*   **What the problem is:** "Sam deposit share" — Sam pays ₹15,000 to Aisha.
*   **How your importer detects it:** `SETTLEMENT_AS_EXPENSE` keyword "deposit".
*   **What policy you applied:** Convert to Settlement.
*   **What ends up in the database:** Inserted into `Settlements` table.

### 21. Split type conflict
*   **Row number:** 42
*   **What the problem is:** "Furniture for common room" has split_type = equal but split_details = "Aisha 1; Rohan 1; Priya 1; Sam 1". Conflicting fields.
*   **How your importer detects it:** `SPLIT_TYPE_CONFLICT` if equal but details provided.
*   **What policy you applied:** Auto-fixed.
*   **What ends up in the database:** `ExpenseSplits` processed as shares.

### 22. Currency conversion missing
*   **Row number:** 20,21,23,26
*   **What the problem is:** USD amounts. The original sheet treats $1 = ₹1. That's wrong (Priya's complaint).
*   **How your importer detects it:** `FOREIGN_CURRENCY` flags any non-INR row.
*   **What policy you applied:** Auto-converts via `USD_TO_INR_RATE` env setting.
*   **What ends up in the database:** `Expenses` table records `amount_inr` via exchange rate.

---

## Section 2: Database Schema

Our application relies on a strict relational model (PostgreSQL) to ensure ACID compliance, referential integrity, and accurate financial calculations.

### Entity Relationship Description
- A **User** can belong to many **Groups**, and a **Group** has many **Users**. This many-to-many relationship is resolved by the `GroupMemberships` table.
- A **Group** tracks many **Expenses** and **Settlements**.
- An **Expense** is paid by one or more **Users**, and split among many **Users**. This is handled by the `ExpenseSplits` table.
- The `ImportRuns` and `ImportAnomalies` tables sit adjacent to the core tables, acting as a staging area to hold parsed CSV rows until they are resolved by a human.

### Tables & Relationships

#### 1. `Users`
*   **Why it exists:** To store global identities, authentication credentials, and contact info for all users across any group.
*   **Schema:** `id` (PK), `name` (String), `email` (String, Unique), `password_hash` (String).

#### 2. `Groups`
*   **Why it exists:** To isolate expenses and settlements. A user might have a group with flatmates and another for a specific trip. Debt simplification only runs *within* a group context.
*   **Schema:** `id` (PK), `name` (String), `created_by` (FK -> Users).

#### 3. `GroupMemberships`
*   **Why it exists:** Resolves the Many-to-Many between Users and Groups. **Crucially**, it contains `joined_at` and `left_at` date columns. This directly solves Sam and Meera's temporal requirements. A simple `is_active` boolean on the User table would not allow us to historically reconstruct who was supposed to pay for a bill from 3 months ago.
*   **Schema:** `id` (PK), `group_id` (FK -> Groups), `user_id` (FK -> Users), `joined_at` (Date), `left_at` (Date, Nullable).
*   **Joins:** Joins `Users.id` to `Groups.id`. 

#### 4. `Expenses`
*   **Why it exists:** The core record of a real-world transaction. It stores the *normalized* value of the expense. To solve Priya's USD issue, we don't force users to do math outside the app. We store the `currency` and `exchange_rate` so the system always knows the exact value in the group's base currency (`amount_inr`) at the moment the expense occurred.
*   **Schema:** `id` (PK), `group_id` (FK -> Groups), `description` (String), `amount` (Decimal), `currency` (String), `amount_inr` (Decimal), `exchange_rate` (Decimal), `paid_by` (FK -> Users), `split_type` (String), `expense_date` (Date), `is_settlement` (Boolean), `import_row` (Integer, Nullable), `import_note` (Text, Nullable), `is_deleted` (Boolean, Soft Delete).
*   **Joins:** Belongs to a single `Group` (`group_id`). Links to `Users` (`paid_by`).

#### 5. `ExpenseSplits`
*   **Why it exists:** An expense is rarely paid by one person and owed entirely by another. This table breaks down a single `Expense` into exact `amount_owed` for every `User` involved. It also tracks the `share_value` (e.g., percentage or share proportion). It is the ledger entry that drives Rohan's "Audit Trail" requirement.
*   **Schema:** `id` (PK), `expense_id` (FK -> Expenses), `user_id` (FK -> Users), `amount_owed` (Decimal), `share_value` (Decimal, Nullable), `settled` (Boolean).
*   **Joins:** Links `Expenses.id` to specific `Users.id`.

#### 6. `Settlements`
*   **Why it exists:** Distinguishes a "repayment" from a "purchase". While Aisha paying a ₹1000 restaurant bill creates debt, Rohan sending Aisha ₹500 *clears* debt. Keeping them in a separate table prevents infinite loops in the debt simplification algorithm and keeps the semantic meaning clear.
*   **Schema:** `id` (PK), `group_id` (FK -> Groups), `payer_id` (FK -> Users), `payee_id` (FK -> Users), `amount` (Decimal), `date` (Date).
*   **Joins:** Belongs to a `Group`. Links two `Users` (`payer_id`, `payee_id`).

#### 7. `ImportRuns` & `ImportAnomalies`
*   **Why they exist:** To satisfy Meera's requirement for explicit approval. We cannot stream CSV data directly into `Expenses`. When a user uploads a file, it creates an `ImportRun`. Every detected issue creates an `ImportAnomaly` containing the raw JSON of the problematic row. The UI queries these anomalies, allows the user to resolve them, and only then commits the clean data to the core tables.
*   **Schema (Runs):** `id` (PK, UUID), `group_id` (FK -> Groups), `total_rows` (Integer), `imported` (Integer), `flagged` (Integer), `skipped` (Integer), `auto_fixed` (Integer), `exchange_rate_used` (Decimal), `timestamp` (DateTime).
*   **Schema (Anomalies):** `id` (PK), `import_run_id` (FK -> ImportRuns), `csv_row` (Integer), `anomaly_type` (String), `description` (Text), `raw_data` (JSON), `action_taken` (String), `resolved` (Boolean), `resolved_at` (DateTime), `resolved_by` (FK -> Users).
*   **Joins:** `ImportAnomalies.import_run_id` links to `ImportRuns.id`.
