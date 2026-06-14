# EquiSplit - Shared Expenses Application

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

EquiSplit is a robust web application designed to track shared expenses among flatmates and travel groups. It handles dynamic group memberships, multi-currency expenses, detailed audit trails, and provides a powerful data import pipeline with anomaly detection and user approval workflows.

## Features

- **Authentication:** Secure login and registration.
- **Group Management:** Create groups and manage time-bound memberships.
- **Expense Tracking:** Add expenses, split them in various ways (Equal, Exact, Percentage, Shares), and track in multi-currency.
- **Smart Importer:** Robust CSV ingestion pipeline with an interactive UI to detect and resolve legacy data anomalies (duplicates, conflicting entries).
- **Settlements:** Calculate simplified debts and record payments.

## Prerequisites

Before you begin, ensure you have met the following requirements:
- **Node.js** (v18.0.0 or newer)
- **Python** (v3.9 or newer)
- **PostgreSQL** database instance

## Setup Instructions

### 1. Backend Setup (FastAPI)

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
   *(Note: Requirements file to be updated. Core packages include `fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `psycopg2-binary`)*
4. Set up your environment variables (e.g., `DATABASE_URL`) in a `.env` file.
5. Run database migrations:
   ```bash
   alembic upgrade head
   ```
6. Start the development server:
   ```bash
   fastapi dev main.py
   # Or using uvicorn directly:
   uvicorn main:app --reload
   ```

### 2. Frontend Setup (Next.js)

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
4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```text
spreetail-expenses/
├── backend/            # FastAPI application, SQLAlchemy models, Alembic migrations
├── frontend/           # Next.js App Router, Tailwind CSS UI components
├── target.md           # Application design and architecture specification
└── README.md           # Project documentation
```

## AI Development Partner

This project is being developed with the assistance of **Antigravity**, an advanced agentic coding assistant designed by the Google DeepMind team. The AI is utilized for:
- Architecture planning and system design (`target.md`).
- Project scaffolding and environment setup.
- Writing boilerplate code, database models, and API endpoints.
- Building frontend components and styling using Tailwind CSS.
- Problem-solving and debugging complex application logic (such as the data import pipeline).

All code produced is reviewed and overseen by human engineers to ensure quality and adherence to project requirements.

## Roadmap & Progress

- [x] Initial architecture and product design (`target.md`).
- [x] Repository scaffolding (Frontend & Backend setups).
- [ ] Database schema creation (Users, Groups, Expenses).
- [ ] Core REST APIs (Authentication, Group Management).
- [ ] Next.js Frontend layouts and components.
- [ ] The "Smart" CSV Data Import pipeline & rules engine.
- [ ] Interactive UI for anomaly resolution.
