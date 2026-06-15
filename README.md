# EquiSplit - Shared Expenses & Interactive Settlement Application

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![SQLite/PostgreSQL](https://img.shields.io/badge/Database-SQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

EquiSplit is a robust, full-stack web application meticulously engineered to track shared expenses among flatmates and travel groups. Moving beyond simple calculators, EquiSplit handles complex real-world edge cases: dynamic time-bound group memberships, multi-currency expenses needing historical exchange rates, detailed immutable audit trails, and a sophisticated data import pipeline armed with rigorous anomaly detection and an interactive human-in-the-loop review system.

## 🎯 Core Features

- **Smart Interactive Importer:** A specialized CSV ingestion pipeline designed to ingest highly problematic legacy data. The system automatically scrubs data (e.g. whitespace, commas), resolves minor typos using fuzzy-matching algorithms, and flags major conflicts (duplicates, negative amounts, unknown currencies, temporal paradoxes). It provides an interactive UI forcing human review and approval for destructive actions, ensuring high data fidelity.
- **Graph-Based Debt Simplification:** Condenses complex webs of interpersonal debts into the absolute minimum number of transactions needed to settle all balances (e.g., "Aisha owes Rohan ₹500").
- **Dynamic Memberships:** Calculates split allocations accurately by evaluating user presence against exact timestamped entry (`joined_at`) and exit (`left_at`) dates.
- **Multi-Currency Normalization:** Freezes the value of foreign currency purchases to a baseline local currency using precise exchange rates at the time of the transaction, eliminating the chaos of fluctuating live market rates.
- **Granular Splitting Methods:** Supports equal divisions, exact monetary amounts, exact percentages, and fractional shares.

---

## 🏗️ Architecture & Technology Stack

The application is structured into a cleanly decoupled frontend and backend, ensuring separation of concerns, scalability, and ease of testing.

### Backend: FastAPI & Python

The backend is a high-performance REST API built with **FastAPI** (Python 3.9+). 
- **Validation & Serialization:** Relies extensively on **Pydantic v2** to strongly type input schemas, preventing malformed data from ever touching the database layer.
- **Database Layer:** Built on **SQLAlchemy 2.0** using the modern declarative `Mapped` style, heavily utilizing foreign keys and nested database transactions (`db.begin_nested()`) to allow granular rollback of failed CSV row insertions.
- **Database Engine:** Capable of running on local **SQLite** for zero-configuration development, but engineered for strict ACID compliance on **PostgreSQL** in production environments.
- **Schema Migrations:** Managed reliably using **Alembic**.
- **Anomaly Engine:** A specialized module (`anomaly_detector.py`) that evaluates incoming records against 22 known historical data anomalies ranging from name typos to negative amounts.

### Frontend: Next.js (App Router)

The frontend is a modern React application utilizing the **Next.js App Router** paradigm.
- **Component Design:** Focuses on rich, dynamic, and premium UI aesthetics using **Tailwind CSS**. Custom UI components include interactive carousels, responsive tables, and micro-animations for enhanced user engagement.
- **State Management:** Leverages native React Context and Hooks to manage local state, minimizing overhead.
- **Routing & Layouts:** Employs nested file-system routing to neatly separate the core dashboard functionality from the specialized, wizard-like Data Import Review interface.
- **Data Fetching:** Relies on modern fetch mechanisms with `SWR` or React Query (TBD) for optimistic UI updates and real-time reflection of the backend state.

---

## 📡 API Routes

The backend exposes a fully documented REST API. Below are the primary endpoints. You can view the full interactive OpenAPI schema at `http://localhost:8000/docs`.

### Authentication
- `POST /api/auth/register` - Create a new user account.
- `POST /api/auth/login` - Obtain a JWT Bearer token.
- `GET /api/auth/me` - Get current authenticated user details.

### Groups
- `POST /api/groups` - Create a new expense group.
- `GET /api/groups` - List all groups the user belongs to.
- `GET /api/groups/{group_id}` - Get full details of a specific group.
- `POST /api/groups/{group_id}/members` - Add a member to a group.
- `PATCH /api/groups/{group_id}/members/{user_id}/leave` - Set a member's leave date.
- `GET /api/groups/{group_id}/members?date={YYYY-MM-DD}` - Get active members on a specific date.

### Expenses
- `POST /api/expenses?group_id={id}` - Create a new expense with complex splits.
- `GET /api/expenses/{group_id}` - List all active expenses for a group.
- `GET /api/expenses/{group_id}/{expense_id}` - View exact split details for a single expense.
- `DELETE /api/expenses/{expense_id}` - Soft-delete an expense.

### Settlements & Balances
- `POST /api/settlements` - Record a debt repayment between two users.
- `GET /api/groups/{group_id}/settlements` - List all historical settlements for a group.
- `GET /api/settlements/{group_id}/summary` - Get simplified Graph-based balances (minimum transactions to settle all debts).
- `GET /api/settlements/{group_id}/member/{user_id}` - Get detailed raw balance sheet for a specific user.

### Smart CSV Import
- `POST /api/import` - Upload a CSV file and run the anomaly detection engine. Returns an `ImportReport`.
- `GET /api/import/{run_id}/report` - Retrieve a previously generated import report.
- `POST /api/import/{run_id}/resolve/{anomaly_id}` - Submit a human resolution (Approve/Reject/Modify) for a flagged anomaly.

---

## 🚀 Setup & Installation Instructions

### Prerequisites
- **Node.js** (v18.0.0 or newer)
- **Python** (v3.9 or newer)
- **Git**

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up the local environment variables. Simply copy the example file:
   ```bash
   cp .env.example .env
   ```
   *(Note: The default `.env` is configured to use an embedded SQLite database `test.db` for instant development setup.)*
5. Run the database migrations to build the schema:
   ```bash
   alembic upgrade head
   ```
6. Start the development server:
   ```bash
   fastapi dev app/main.py
   # Or using uvicorn directly:
   uvicorn app.main:app --reload
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) with your browser to explore the dashboard.

---

## 🤖 AI Collaboration Notes

This project is actively developed in collaboration with **Antigravity**, an advanced agentic coding assistant engineered by Google DeepMind. 
We adhere strictly to defined guidelines for AI collaboration, logging key decisions and prompt architecture in `DECISIONS.md` and logging prompt engineering iterations or corrections in `AI_USAGE.md`. All AI-generated code is audited by human engineers prior to commits.

## 🗺️ Roadmap & Progress

- [x] Initial architecture and product design (`target.md`).
- [x] Repository scaffolding (Frontend & Backend setups).
- [x] Database schema creation & Alembic Migrations.
- [x] Core REST APIs (Authentication, Group Management).
- [x] The "Smart" CSV Data Import pipeline & rules engine.
- [x] Interactive API endpoints for anomaly resolution.
- [ ] Next.js Frontend Foundation & Theme Config.
- [ ] Next.js Frontend Dashboard and Forms.
- [ ] Interactive React UI for the Import Review Process.
