# Decision Log (DECISIONS.md)

This document records the significant architectural and product decisions made during the development of EquiSplit. It outlines the options considered and the rationale behind each choice.

---

## 1. Tech Stack Selection: Frontend

*   **Decision:** Next.js (App Router) with Tailwind CSS.
*   **Options Considered:**
    *   *React (Vite):* Lightweight, fast to set up, but requires manual configuration for routing and server-side operations.
    *   *Next.js:* Opinionated, built-in file-system routing, API routes, and optimized rendering.
*   **Rationale:** Next.js was chosen for its robust out-of-the-box features. The App Router simplifies complex nested layouts (like the dashboard vs. the import review UI). Tailwind CSS ensures we can quickly deliver a premium, modern aesthetic without writing massive custom CSS files.

## 2. Tech Stack Selection: Backend

*   **Decision:** Python with FastAPI, SQLAlchemy, and Alembic.
*   **Options Considered:**
    *   *Node.js (Express):* Standard, but lacks built-in strong typing and validation.
    *   *Django:* Heavyweight, includes a lot of 'batteries' we might not need for an API-first design.
    *   *FastAPI:* High performance, native asynchronous support, and strong typing via Pydantic.
*   **Rationale:** FastAPI's integration with Pydantic is a game-changer for this project. Since the core requirement involves ingesting and validating a highly problematic CSV file, Pydantic's strict type checking and validation rules will make anomaly detection significantly easier and more reliable.

## 3. Database Paradigm

*   **Decision:** Strict Relational Database (PostgreSQL).
*   **Options Considered:**
    *   *NoSQL (MongoDB):* Flexible schema, good for unstructured data.
    *   *Relational (PostgreSQL):* Strict schema, ACID compliance, complex joins.
*   **Rationale:** This was a mandatory requirement ("Use relational DBs only"), but it is also the correct engineering choice. Financial and expense data is inherently relational (Users belong to Groups, Expenses belong to Groups, Expenses are split among Users). ACID compliance guarantees that settlement transactions don't result in "lost money" during concurrent operations.

## 4. The Data Import Strategy (Meera's Requirement)

*   **Decision:** A Two-Stage Ingestion Pipeline with an Interactive Review UI.
*   **Options Considered:**
    *   *Silent Auto-Resolution:* The app guesses the best fix for anomalies. (Rejected: Fails the requirement "A silent guess is a failing answer").
    *   *Hard Rejection:* The app crashes or rejects the whole file if a single error is found. (Rejected: Horrible user experience given the known messiness of the data).
    *   *Interactive Staging Area:* Parse data into memory/temp tables, flag anomalies, and force the user to select a resolution policy.
*   **Rationale:** Meera explicitly requested: "Clean up the duplicates — but I want to approve anything the app deletes or changes." An interactive staging pipeline is the only way to satisfy this. The system detects problems but delegates the final policy decision to the human, ensuring data integrity and user trust.

## 5. Debt Simplification (Aisha's Requirement)

*   **Decision:** Graph-based Debt Simplification Algorithm.
*   **Options Considered:**
    *   *Raw Bilateral Debts:* Showing every exact transaction owed between every pair of users. (Rejected: Violates Aisha's request).
    *   *Debt Simplification:* Treating the group as a directed graph and calculating the minimum cash flow to settle all balances.
*   **Rationale:** Aisha asked for "one number per person. Who pays whom, how much, done." The simplification algorithm transforms a complex web of debts into a streamlined list of payouts, fulfilling her request perfectly. We will still retain the raw data in the Ledger to satisfy Rohan's requirement ("No magic numbers").

## 6. Managing Dynamic Memberships (Sam's Requirement)

*   **Decision:** Time-Bound Records in `GroupMemberships`.
*   **Options Considered:**
    *   *Simple Boolean Flag:* `is_active` on the user profile. (Rejected: Doesn't solve historical expense calculations).
    *   *Temporal Tables:* Adding `joined_at` and `left_at` timestamp columns to the `GroupMemberships` junction table.
*   **Rationale:** Sam noted: "I moved in mid-April. Why would March electricity affect my balance?" By tying group membership to specific date ranges, the expense creation logic can dynamically filter the default "split equally" list to only include users whose `joined_at` <= `expense_date` <= `left_at`.

## 7. Handling Multi-Currency (Priya's Requirement)

*   **Decision:** Normalization to a Base Group Currency at the time of the transaction.
*   **Options Considered:**
    *   *Separate balances per currency:* User owes $10 AND ₹500. (Rejected: Too complex to settle up).
    *   *Live API conversion:* Convert on the fly during rendering. (Rejected: Unpredictable historical balances).
    *   *Record Exchange Rate per Expense:* Save the exact exchange rate applicable on the specific `expense_date`.
*   **Rationale:** Priya noted the trip was in dollars but the sheet uses rupees. By allowing an expense to have an `original_currency` (USD), `amount` ($100), and an `exchange_rate` (e.g., 83 INR/USD), we calculate a `base_currency_amount` (₹8300) which is then split. This freezes the value in time, preventing historical debts from fluctuating with live market rates.

## 8. Date Parsing Determinism

*   **Decision:** Explicit Regex matching instead of `dateutil`.
*   **Rationale:** The `dateutil` library silently guesses formats (e.g. interpreting `04/05` randomly depending on locale). To ensure accurate detection of `AMBIGUOUS_DATE` anomalies, we implemented deterministic Regex parsing.

## 9. Safe CSV Ingestion Pipeline

*   **Decision:** Nested Database Transactions (`db.begin_nested()`).
*   **Rationale:** The CSV import processes rows iteratively. If a complex math error occurs during `Expense` creation (e.g. percentages not exactly summing to 100%), we must rollback *only* that specific row and flag it, rather than aborting the entire CSV import. Savepoints allow granular error recovery.

## 10. Expense Soft Deletes

*   **Decision:** Implement `is_deleted` on the `Expense` model.
*   **Rationale:** Users need to be able to "delete" expenses from the UI without permanently destroying the audit log required by Rohan. A soft delete retains the historical record while excluding it from the `balance_service` simplification logic.
