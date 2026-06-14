# Project Maintenance Rules (RULES.md)

This file contains the strict guidelines for maintaining the documentation integrity of the EquiSplit project. 

**Core Directive:** Every time there is a major architectural turnaround, a schema change, or a significant update to the codebase, the AI agent and human engineers MUST review and update the following documentation files to keep them in perfect sync with the current state of the application.

## 1. Updating `target.md` (Architecture & Design)
*   **Trigger:** Whenever the fundamental application goals, core features, or the overall architecture of the pipeline change.
*   **Action:** Update the executive summary, user requirement mappings, and the high-level roadmap.

## 2. Updating `DECISIONS.md` (Decision Log)
*   **Trigger:** Whenever a significant engineering choice is made. Examples include adding a new database, swapping a major dependency (e.g., moving from REST to GraphQL), or changing a core business logic policy (e.g., how debts are simplified).
*   **Action:** Log the new decision. You must include the `Decision`, the `Options Considered`, and the `Rationale`.

## 3. Updating `SCOPE.md` (Schema & Anomaly Log)
*   **Trigger A:** Whenever an Alembic migration is created that alters the database schema (adding tables, changing columns, modifying relationships).
*   **Trigger B:** Whenever a new type of data anomaly is discovered in the CSV import process that requires a new handling policy.
*   **Action:** Update the Entity Relationship descriptions, the table definitions, and append new anomalies to the Anomaly Log.

## 4. Updating `AI_USAGE.md` (Collaboration Log)
*   **Trigger:** Whenever the AI assistant writes code that is fundamentally flawed, violates core requirements (like silent failures), or requires human intervention to rewrite for correctness or performance.
*   **Action:** Document the exact error, how the human engineer caught it, and the changes made to correct the AI's output.

## 5. Updating `README.md` (Setup & Project Overview)
*   **Trigger:** Whenever the local development environment requirements change (e.g., adding Redis, changing Node versions) or the deployment process is modified.
*   **Action:** Keep the "Prerequisites" and "Setup Instructions" completely up to date so any new developer can onboard smoothly.

## 6. Updating `IMPORT_REPORT.md` (Mockup/Template)
*   **Trigger:** Whenever the UI/UX design of the generated import report changes.
*   **Action:** Update the exact textual representation in the file to match the newly generated output format.
