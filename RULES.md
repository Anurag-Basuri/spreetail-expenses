# Project Maintenance Rules (RULES.md)

This file contains the strict guidelines for maintaining the documentation integrity and code quality of the EquiSplit project. 

**Core Directive:** Every time there is a major architectural turnaround, a schema change, or a significant update to the codebase, the AI agent and human engineers MUST review and update the following documentation files to keep them in perfect sync with the current state of the application.

---

## Documentation Rules

### 1. Updating `target.md` (Architecture & Design)
*   **Trigger:** Whenever the fundamental application goals, core features, or the overall architecture of the pipeline change.
*   **Action:** Update the executive summary, user requirement mappings, and the high-level roadmap.

### 2. Updating `DECISIONS.md` (Decision Log)
*   **Trigger:** Whenever a significant engineering choice is made. Examples include adding a new database, swapping a major dependency (e.g., moving from REST to GraphQL), or changing a core business logic policy (e.g., how debts are simplified).
*   **Action:** Log the new decision. You must include the `Decision`, the `Options Considered`, and the `Rationale`.

### 3. Updating `SCOPE.md` (Schema & Anomaly Log)
*   **Trigger A:** Whenever an Alembic migration is created that alters the database schema (adding tables, changing columns, modifying relationships).
*   **Trigger B:** Whenever a new type of data anomaly is discovered in the CSV import process that requires a new handling policy.
*   **Action:** Update the Entity Relationship descriptions, the table definitions, and append new anomalies to the Anomaly Log.

### 4. Updating `AI_USAGE.md` (Collaboration Log)
*   **Trigger:** Whenever the AI assistant writes code that is fundamentally flawed, violates core requirements (like silent failures), or requires human intervention to rewrite for correctness or performance.
*   **Action:** Document the exact error, how the human engineer caught it, and the changes made to correct the AI's output.

### 5. Updating `README.md` (Setup & Project Overview)
*   **Trigger:** Whenever the local development environment requirements change (e.g., adding Redis, changing Node versions) or the deployment process is modified.
*   **Action:** Keep the "Prerequisites" and "Setup Instructions" completely up to date so any new developer can onboard smoothly.

### 6. Updating `IMPORT_REPORT.md` (Mockup/Template)
*   **Trigger:** Whenever the UI/UX design of the generated import report changes.
*   **Action:** Update the exact textual representation in the file to match the newly generated output format.

---

## Coding Standards

### 7. Decimal-Only Monetary Calculations
*   **Rule:** All monetary values MUST use Python `Decimal`. Never use `float` for amounts, shares, percentages, or exchange rates.
*   **Rounding:** Use `ROUND_HALF_UP` and quantize to `Decimal("0.01")` only at the final step of each calculation.
*   **Remainder Handling:** In split calculations, the last participant absorbs any rounding remainder so that `sum(splits) == total` exactly.

### 8. No Bare `except:` Clauses
*   **Rule:** Always catch specific exceptions (`except Exception:`, `except ValueError:`, etc.). Bare `except:` swallows `SystemExit`, `KeyboardInterrupt`, and masks real bugs.
*   **Rationale:** This was discovered during the system audit — two bare `except:` clauses were silently hiding parsing failures.

### 9. Import Completeness
*   **Rule:** Every symbol used in a file MUST be explicitly imported. Before using `relationship()`, `or_()`, `Decimal`, or any other library function, verify the import statement exists at the top of the file.
*   **Rationale:** A missing `relationship` import in `expense.py` caused a `NameError` that would have crashed every expense query at runtime.

### 10. No Empty Stub Files for Wired Modules
*   **Rule:** If `main.py` (or any other file) imports a module's `router` or `service`, that module MUST define the expected symbol. An empty file is a guaranteed `AttributeError` crash on startup.
*   **Action:** When scaffolding new modules, always include at minimum:
    ```python
    from fastapi import APIRouter
    router = APIRouter()
    ```

### 11. Pydantic v2 Conventions
*   **Rule:** All Pydantic schemas MUST use `model_config = ConfigDict(from_attributes=True)` instead of the deprecated Pydantic v1 `class Config: orm_mode = True`.
*   **Rule:** Use `Field(...)` for validation constraints (`min_length`, `max_length`, etc.).

### 12. SQLAlchemy 2.0 Declarative Style
*   **Rule:** All ORM models MUST use the modern `Mapped[type]` + `mapped_column()` syntax, not the legacy `Column()` style.
*   **Rule:** Use `DeclarativeBase` (not `declarative_base()`).

---

## Git & Version Control

### 13. Commit Grouping
*   **Rule:** Push files in logical groups of **no more than 3-4 files per commit**.
*   **Format:** Use conventional commit prefixes: `feat()`, `fix()`, `docs()`, `refactor()`, `test()`.
*   **Examples:**
    - `feat(models): implement complete SQLAlchemy ORM schemas`
    - `fix(critical): fix fatal import errors in anomaly_detector and expense model`
    - `docs: update scope, decisions, and ai usage logs`

### 14. No Broken Commits
*   **Rule:** Every commit MUST leave the application in a runnable state. Never push a file that imports a module which doesn't exist yet. If two files depend on each other, commit them together.

---

## Quality Assurance

### 15. System Audit Protocol
*   **Trigger:** After completing a major feature milestone (e.g., finishing all backend services).
*   **Action:** Read every source file and verify:
    - All imports resolve correctly
    - All cross-file references (router wiring, service calls, model relationships) are valid
    - No bare `except:`, no `float` for money, no missing `__init__.py` exports
    - All empty stubs have been filled or removed

### 16. Testing Requirements
*   **Rule:** All utility functions (`date_parser`, `name_normalizer`, `calculate_splits`) MUST have unit tests.
*   **Rule:** Tests MUST cover edge cases explicitly drawn from the CSV anomaly list in `SCOPE.md`.
*   **Location:** Tests live in `backend/tests/` and are run with `pytest`.
