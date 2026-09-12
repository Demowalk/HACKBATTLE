# 🗄️ Reviso Database Architecture

This directory houses the database infrastructure, ORM models, migration readiness, and CRUD operations for **reviso** — an autonomous adaptive study and self-learning engine.

---

## 🏗️ Architecture Overview

The database utilizes **SQLAlchemy 2.0** with **dual-environment support**:
- **Local Development**: Auto-configures **SQLite** (`sqlite:///./database/reviso.db`) with zero setup or external server dependencies.
- **Production Deployment**: Connects directly to **PostgreSQL** (e.g. **Neon**, **Supabase**, **Render**, **Railway**, **AWS RDS**) via standard `DATABASE_URL` environment variable.

```
database/
├── __init__.py         # Package interface & core exports
├── connection.py       # Engine, SessionLocal, and FastAPI get_db dependency
├── models.py           # Declarative SQLAlchemy ORM models
├── schemas.py          # Pydantic v2 schemas for request/response serialization
├── crud.py             # Optimized queries (Tasks, Quizzes, Concept Mastery, Users)
├── init_db.py          # Table initialization and demo seed script
├── requirements.txt    # Database Python dependencies
├── .gitignore          # Ignores local *.db, *.sqlite files and pycache
└── README.md           # Architecture documentation & setup guide
```

---

## 📊 Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ TASKS : "schedules & completes"
    USERS ||--o{ QUIZZES : "attempts"
    USERS ||--o{ CONCEPT_MASTERY : "tracks retention"
    QUIZZES ||--|{ QUIZ_QUESTIONS : "contains"

    USERS {
        int id PK
        string username
        string email
        int streak
        int total_study_minutes
        datetime created_at
    }

    TASKS {
        int id PK
        int user_id FK
        string title
        string subject
        string topic
        int duration_minutes
        string priority
        string time_slot
        string scheduled_date
        boolean completed
        boolean alarm_active
        datetime created_at
        datetime updated_at
    }

    QUIZZES {
        int id PK
        int user_id FK
        string subject
        string topic
        string difficulty
        int score
        int total_questions
        string weak_topic
        datetime created_at
    }

    QUIZ_QUESTIONS {
        int id PK
        int quiz_id FK
        text question_text
        json options
        string correct_answer
        string selected_answer
        text explanation
    }

    CONCEPT_MASTERY {
        int id PK
        int user_id FK
        string subject
        string topic
        float mastery_score
        float decay_risk
        datetime last_reviewed_at
    }
```

---

## ⚡ Quickstart

### 1. Install Dependencies
```bash
pip install -r database/requirements.txt
```

### 2. Connect to Supabase
1. Create a free project at **[supabase.com](https://supabase.com)**.
2. Open your project's **SQL Editor** in the Supabase dashboard.
3. Paste the contents of **[`database/schema.sql`](file:///Users/lakshhs/HACKBATTLE/database/schema.sql)** and click **Run**. This will create all tables, indexes, RLS policies, and seed data.
4. Copy your credentials from **Project Settings ➔ Database / API** into your `.env` file:
```env
# Supabase PostgreSQL Connection URL (Transaction Pooler port 6543 or direct port 5432):
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require

# Supabase REST / Auth / Realtime API:
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-or-service-role-key
```

### 3. Local SQLite Mode (Offline Fallback)
If `DATABASE_URL` is omitted, Reviso automatically defaults to local SQLite (`sqlite:///./database/reviso.db`). You can initialize and seed local SQLite with:
```bash
python database/init_db.py
```

---

## 🔌 Connecting to FastAPI Backend

### Approach A: Using SQLAlchemy ORM (Recommended)
```python
from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session
from database.connection import get_db
from database.crud import get_tasks, create_task, toggle_task_completion
from database.schemas import TaskCreate, TaskOut

app = FastAPI()

@app.get("/tasks", response_model=list[TaskOut])
def read_tasks(db: Session = Depends(get_db)):
    return get_tasks(db)

@app.post("/tasks", response_model=TaskOut)
def add_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    return create_task(db, task_in)

@app.patch("/tasks/{task_id}/toggle", response_model=TaskOut)
def toggle_task(task_id: int, db: Session = Depends(get_db)):
    return toggle_task_completion(db, task_id)
```

### Approach B: Using Supabase Python Client Directly
```python
from database.supabase_client import get_supabase, supabase_fetch_tasks

@app.get("/supabase/tasks")
def get_supabase_tasks():
    sb = get_supabase()
    if not sb:
        return {"error": "Supabase credentials not configured"}
    return supabase_fetch_tasks()
```
