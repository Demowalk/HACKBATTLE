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

### 2. Initialize Database & Seed Demo Data
To create tables and seed default tasks matching the frontend state:
```bash
python database/init_db.py
```

### 3. Environment Variables
In your `.env` file:
```env
# Optional: Defaults to SQLite if not provided
# Local SQLite:
DATABASE_URL=sqlite:///./database/reviso.db

# Production PostgreSQL (Neon, Supabase, Render, Railway):
# DATABASE_URL=postgresql://user:password@ep-cool-fog.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## 🔌 Connecting to FastAPI Backend

To use the database in `backend/main.py`:

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
