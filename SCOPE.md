# Scope & Anomaly Log (SCOPE.md)

## Section 1: Anomaly Log

Below is the log of the 22 anomalies detected during the ingestion of `expenses_export.csv`. Each entry details the raw problem, our detection logic, the applied resolution policy (often requiring explicit user approval via the Interactive Dashboard), and the final database state.

### 1. Negative Amount (Refund)
*   **Row number:** 14
*   **What the problem is (exact raw CSV value):** Amount: `-500`, Description: `Refund for cancelled train`
*   **How your importer detects it:** The parsed numeric value in the 'Amount' column is less than 0.
*   **What policy you applied:** Flagged in UI. User explicitly selected the "Treat as Refund" policy.
*   **What ends up in the database:** Inserted into `Expenses` with a negative `total_amount` (-500). The `ExpenseSplits` reflect negative owed amounts, crediting the original payers.

### 2. Negative Amount (Data Entry Error)
*   **Row number:** 28
*   **What the problem is (exact raw CSV value):** Amount: `-450`, Description: `Groceries`
*   **How your importer detects it:** Parsed amount < 0.
*   **What policy you applied:** Flagged in UI. User recognized it as a typo and selected "Edit Amount" policy, changing it to 450.
*   **What ends up in the database:** Inserted into `Expenses` with `total_amount` = 450.

### 3. Exact Duplicate (Row 1)
*   **Row number:** 42
*   **What the problem is (exact raw CSV value):** Date: `2024-02-15`, Desc: `Wifi Bill`, Payer: `Aisha`, Amount: `1200`
*   **How your importer detects it:** Exact match on Date, Desc, Payer, and Amount with Row 43.
*   **What policy you applied:** Grouped in UI. User selected "Merge into One" policy.
*   **What ends up in the database:** Only a single `Expenses` record is created for the Wifi Bill.

### 4. Exact Duplicate (Row 2)
*   **Row number:** 43
*   **What the problem is (exact raw CSV value):** Date: `2024-02-15`, Desc: `Wifi Bill`, Payer: `Aisha`, Amount: `1200`
*   **How your importer detects it:** Exact match with Row 42.
*   **What policy you applied:** Grouped in UI. User selected "Merge into One" policy.
*   **What ends up in the database:** Dropped. No database entry for this specific row.

### 5. Conflicting Duplicate (Version A)
*   **Row number:** 55
*   **What the problem is (exact raw CSV value):** Date: `2024-02-20`, Desc: `Dinner at Taj`, Payer: `Rohan`, Amount: `4500`
*   **How your importer detects it:** Match on Date, Desc, and Payer with Row 56, but amounts differ.
*   **What policy you applied:** Flagged as Conflict. User investigated and selected "Pick Row A (4500)" policy.
*   **What ends up in the database:** Inserted into `Expenses` with `total_amount` = 4500.

### 6. Conflicting Duplicate (Version B)
*   **Row number:** 56
*   **What the problem is (exact raw CSV value):** Date: `2024-02-20`, Desc: `Dinner at Taj`, Payer: `Rohan`, Amount: `4800`
*   **How your importer detects it:** Match with Row 55, different amount.
*   **What policy you applied:** Flagged as Conflict. User explicitly discarded this row in favor of Row 55.
*   **What ends up in the database:** Dropped entirely.

### 7. Settlement logged as Expense (Rohan -> Aisha)
*   **Row number:** 72
*   **What the problem is (exact raw CSV value):** Desc: `Paid Aisha back for Feb rent`, Payer: `Rohan`, Amount: `15000`
*   **How your importer detects it:** Keyword detection in Description column ("Paid ... back").
*   **What policy you applied:** Flagged as potential settlement. User confirmed and selected "Convert to Settlement". User mapped Payee to Aisha.
*   **What ends up in the database:** Inserted into the `Settlements` table (Payer: Rohan, Payee: Aisha, Amount: 15000). No `Expenses` record created.

### 8. Settlement logged as Expense (Sam -> Dev)
*   **Row number:** 105
*   **What the problem is (exact raw CSV value):** Desc: `Transfer to Dev`, Payer: `Sam`, Amount: `2000`
*   **How your importer detects it:** Keyword detection ("Transfer to").
*   **What policy you applied:** Flagged. User selected "Convert to Settlement".
*   **What ends up in the database:** Inserted into `Settlements` table.

### 9. Pre-Join Expense (Sam's Issue)
*   **Row number:** 88
*   **What the problem is (exact raw CSV value):** Date: `2024-03-15`, Desc: `March Electricity`, Split involves `Sam`.
*   **How your importer detects it:** Expense Date (Mar 15) is strictly less than Sam's `GroupMemberships.joined_at` date (Mid-April).
*   **What policy you applied:** Flagged. System defaulted to removing Sam from the split. User clicked "Accept Exclusion".
*   **What ends up in the database:** Inserted into `Expenses`. In the `ExpenseSplits` table, Sam has no record. The total amount is redistributed equally among the remaining active members.

### 10. Post-Leave Expense (Meera's Issue)
*   **Row number:** 112
*   **What the problem is (exact raw CSV value):** Date: `2024-04-05`, Desc: `April Groceries`, Split involves `Meera`.
*   **How your importer detects it:** Expense Date (Apr 5) is strictly greater than Meera's `GroupMemberships.left_at` date (End of March).
*   **What policy you applied:** Flagged. User selected "Override and Include" because Meera consumed the groceries before leaving but they were bought later.
*   **What ends up in the database:** Inserted into `Expenses`. `ExpenseSplits` includes a record for Meera despite her inactive status on that date.

### 11. Hidden Currency (Priya's USD Issue)
*   **Row number:** 120
*   **What the problem is (exact raw CSV value):** Desc: `Trip souvenirs USD`, Amount: `45`
*   **How your importer detects it:** Regex match for currency codes ("USD") in the description or notes, coupled with unusually low amount compared to the group's INR baseline.
*   **What policy you applied:** Flagged. User selected "Convert to Base Currency" policy and inputted the historical exchange rate (83.5).
*   **What ends up in the database:** `Expenses` table records `total_amount` = 3757.5, `original_currency` = 'USD', `exchange_rate` = 83.5.

### 12. Missing Currency Format
*   **Row number:** 125
*   **What the problem is (exact raw CSV value):** Amount: `$120`
*   **How your importer detects it:** Pre-parser detects non-numeric symbol `$`.
*   **What policy you applied:** Auto-sanitized to extract `120`. Flagged for currency confirmation due to `$`. User confirmed it as USD and provided exchange rate.
*   **What ends up in the database:** `Expenses` record normalized to INR using the provided exchange rate.

### 13. Name Typo (Meera)
*   **Row number:** 140
*   **What the problem is (exact raw CSV value):** Payer: `Mira`
*   **How your importer detects it:** Foreign key mapping failure. "Mira" does not exactly match any `Users.name` in the database.
*   **What policy you applied:** Fuzzy matching flagged it and suggested `Meera`. User selected "Map to Meera".
*   **What ends up in the database:** Foreign key in `Expenses.payer_id` correctly points to Meera's user ID.

### 14. Name Typo (Dev)
*   **Row number:** 142
*   **What the problem is (exact raw CSV value):** Payer: `Devv`
*   **How your importer detects it:** Foreign key mapping failure.
*   **What policy you applied:** Fuzzy matching suggested `Dev`. User confirmed.
*   **What ends up in the database:** Foreign key correctly points to Dev's ID.

### 15. Missing Payer
*   **Row number:** 150
*   **What the problem is (exact raw CSV value):** Date: `2024-03-01`, Desc: `Netflix`, Payer: ` ` (Blank)
*   **How your importer detects it:** Required field `Payer` evaluates to null/empty string during validation.
*   **What policy you applied:** Hard Flag. User was forced to select a payer from a dropdown. User selected `Aisha`.
*   **What ends up in the database:** `Expenses` record created with `payer_id` pointing to Aisha.

### 16. Number Format Error (Commas)
*   **Row number:** 165
*   **What the problem is (exact raw CSV value):** Amount: `1,500.50`
*   **How your importer detects it:** Float parsing fails due to the comma.
*   **What policy you applied:** Auto-sanitization. The parser automatically strips `,` before attempting float conversion.
*   **What ends up in the database:** `Expenses` table stores `1500.50` (Decimal).

### 17. Number Format Error (Text)
*   **Row number:** 170
*   **What the problem is (exact raw CSV value):** Amount: `Rs. 500`
*   **How your importer detects it:** Float parsing fails.
*   **What policy you applied:** Auto-sanitization strips "Rs. ".
*   **What ends up in the database:** `Expenses` table stores `500.00`.

### 18. Future Date Typo
*   **Row number:** 180
*   **What the problem is (exact raw CSV value):** Date: `2025-02-14`
*   **How your importer detects it:** Parsed date > `current_date`.
*   **What policy you applied:** Flagged as anomaly. User corrected the typo in the UI to `2024-02-14`.
*   **What ends up in the database:** `Expenses` table stores date `2024-02-14`.

### 19. Invalid Date Format
*   **Row number:** 185
*   **What the problem is (exact raw CSV value):** Date: `14/02/2024`
*   **How your importer detects it:** Does not match expected `YYYY-MM-DD` ISO format.
*   **What policy you applied:** Date parser attempts fallback formats (DD/MM/YYYY). Successfully parsed. User visually confirmed the standard ISO conversion in the UI.
*   **What ends up in the database:** Standardized Date `2024-02-14`.

### 20. Empty/Junk Row
*   **Row number:** 190
*   **What the problem is (exact raw CSV value):** All columns empty except commas: `,,,,`
*   **How your importer detects it:** Row contains no alphanumeric characters in critical fields (Date, Amount, Desc).
*   **What policy you applied:** Auto-Ignored.
*   **What ends up in the database:** Nothing. Completely discarded.

### 21. Missing Description
*   **Row number:** 200
*   **What the problem is (exact raw CSV value):** Desc: ` ` (Blank), Amount: `100`
*   **How your importer detects it:** Description field is null/empty.
*   **What policy you applied:** Flagged as missing context. User opted to type in `Snacks` before approving.
*   **What ends up in the database:** `Expenses` table stores description `Snacks`.

### 22. Unknown Split Type String
*   **Row number:** 210
*   **What the problem is (exact raw CSV value):** Split Type: `Half-half`
*   **How your importer detects it:** Does not match known enums ('EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES').
*   **What policy you applied:** Flagged. User mapped "Half-half" to the standard `EQUAL` split type policy.
*   **What ends up in the database:** `ExpenseSplits` records are generated using the standard Equal division logic.

---

## Section 2: Database Schema

Our application relies on a strict relational model (PostgreSQL) to ensure ACID compliance, referential integrity, and accurate financial calculations.

### Entity Relationship Description
- A **User** can belong to many **Groups**, and a **Group** has many **Users**. This many-to-many relationship is resolved by the `GroupMemberships` table.
- A **Group** tracks many **Expenses** and **Settlements**.
- An **Expense** is paid by one or more **Users**, and split among many **Users**. This is handled by the `ExpenseSplits` table.
- The `ImportBatches` and `ImportAnomalies` tables sit adjacent to the core tables, acting as a staging area to hold parsed CSV rows until they are resolved by a human.

### Tables & Relationships

#### 1. `Users`
*   **Why it exists:** To store global identities, authentication credentials, and contact info for all users across any group.
*   **Schema:** `id` (PK), `name` (String), `email` (String, Unique), `password_hash` (String).

#### 2. `Groups`
*   **Why it exists:** To isolate expenses and settlements. A user might have a group with flatmates and another for a specific trip. Debt simplification only runs *within* a group context.
*   **Schema:** `id` (PK), `name` (String), `base_currency` (String, default 'INR').

#### 3. `GroupMemberships`
*   **Why it exists:** Resolves the Many-to-Many between Users and Groups. **Crucially**, it contains `joined_at` and `left_at` date columns. This directly solves Sam and Meera's temporal requirements. A simple `is_active` boolean on the User table would not allow us to historically reconstruct who was supposed to pay for a bill from 3 months ago.
*   **Schema:** `id` (PK), `group_id` (FK -> Groups), `user_id` (FK -> Users), `joined_at` (Date), `left_at` (Date, Nullable).
*   **Joins:** Joins `Users.id` to `Groups.id`. 

#### 4. `Expenses`
*   **Why it exists:** The core record of a real-world transaction. It stores the *normalized* value of the expense. To solve Priya's USD issue, we don't force users to do math outside the app. We store the `original_currency` and `exchange_rate` so the system always knows the exact value in the group's `base_currency` at the moment the expense occurred.
*   **Schema:** `id` (PK), `group_id` (FK -> Groups), `description` (String), `expense_date` (Date), `total_amount` (Decimal), `original_currency` (String), `exchange_rate` (Decimal).
*   **Joins:** Belongs to a single `Group` (`group_id`).

#### 5. `ExpenseSplits`
*   **Why it exists:** An expense is rarely paid by one person and owed entirely by another. This table breaks down a single `Expense` into exact `amount_paid` and `amount_owed` for every `User` involved. It is the ledger entry that drives Rohan's "Audit Trail" requirement.
*   **Schema:** `id` (PK), `expense_id` (FK -> Expenses), `user_id` (FK -> Users), `amount_paid` (Decimal), `amount_owed` (Decimal).
*   **Joins:** Links `Expenses.id` to specific `Users.id`.

#### 6. `Settlements`
*   **Why it exists:** Distinguishes a "repayment" from a "purchase". While Aisha paying a ₹1000 restaurant bill creates debt, Rohan sending Aisha ₹500 *clears* debt. Keeping them in a separate table prevents infinite loops in the debt simplification algorithm and keeps the semantic meaning clear.
*   **Schema:** `id` (PK), `group_id` (FK -> Groups), `payer_id` (FK -> Users), `payee_id` (FK -> Users), `amount` (Decimal), `date` (Date).
*   **Joins:** Belongs to a `Group`. Links two `Users` (`payer_id`, `payee_id`).

#### 7. `ImportBatches` & `ImportAnomalies`
*   **Why they exist:** To satisfy Meera's requirement for explicit approval. We cannot stream CSV data directly into `Expenses`. When a user uploads a file, it creates an `ImportBatch`. Every detected issue creates an `ImportAnomaly` containing the raw JSON of the problematic row. The UI queries these anomalies, allows the user to resolve them, and only then commits the clean data to the core tables.
*   **Schema (Batches):** `id` (PK), `group_id` (FK -> Groups), `status` (String).
*   **Schema (Anomalies):** `id` (PK), `batch_id` (FK -> ImportBatches), `anomaly_type` (String), `raw_row_data` (JSON), `resolution_status` (String).
*   **Joins:** `ImportAnomalies.batch_id` links to `ImportBatches.id`.
