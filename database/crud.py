from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from .models import User, Task, Quiz, QuizQuestion, ConceptMastery
from .schemas import TaskCreate, TaskUpdate, QuizCreate


# ---------------------------------------------------------------------------
# User CRUD
# ---------------------------------------------------------------------------
def get_or_create_default_user(db: Session) -> User:
    """Fetch or create a default user for single-user demo/development."""
    user = db.query(User).first()
    if not user:
        user = User(
            username="student_reviso",
            email="student@reviso.ai",
            streak=5,
            total_study_minutes=720,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Task CRUD
# ---------------------------------------------------------------------------
def get_tasks(
    db: Session,
    user_id: Optional[int] = None,
    scheduled_date: Optional[str] = None,
    completed: Optional[bool] = None,
) -> List[Task]:
    """Retrieve tasks with optional filters."""
    query = db.query(Task)
    if user_id is not None:
        query = query.filter(Task.user_id == user_id)
    if scheduled_date is not None:
        query = query.filter(Task.scheduled_date == scheduled_date)
    if completed is not None:
        query = query.filter(Task.completed == completed)
    return query.order_by(Task.scheduled_date.asc(), Task.id.asc()).all()


def get_task_by_id(db: Session, task_id: int) -> Optional[Task]:
    """Find a specific task by its ID."""
    return db.query(Task).filter(Task.id == task_id).first()


def create_task(db: Session, task_in: TaskCreate) -> Task:
    """Create and persist a new task."""
    db_task = Task(**task_in.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task(db: Session, task_id: int, task_update: TaskUpdate) -> Optional[Task]:
    """Update fields on an existing task."""
    db_task = get_task_by_id(db, task_id)
    if not db_task:
        return None

    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)

    db_task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_task)
    return db_task


def toggle_task_completion(db: Session, task_id: int) -> Optional[Task]:
    """Toggle completion status of a task."""
    db_task = get_task_by_id(db, task_id)
    if not db_task:
        return None

    db_task.completed = not db_task.completed
    db_task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task(db: Session, task_id: int) -> bool:
    """Delete a task by ID."""
    db_task = get_task_by_id(db, task_id)
    if not db_task:
        return False
    db.delete(db_task)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Quiz CRUD
# ---------------------------------------------------------------------------
def create_quiz_with_questions(db: Session, quiz_in: QuizCreate) -> Quiz:
    """Persist a newly generated quiz with its set of multiple-choice questions."""
    db_quiz = Quiz(
        subject=quiz_in.subject,
        topic=quiz_in.topic,
        difficulty=quiz_in.difficulty,
        total_questions=len(quiz_in.questions),
        user_id=quiz_in.user_id,
    )
    db.add(db_quiz)
    db.flush()  # assign db_quiz.id

    for q in quiz_in.questions:
        db_q = QuizQuestion(
            quiz_id=db_quiz.id,
            question_text=q.question_text,
            options=q.options,
            correct_answer=q.correct_answer,
            explanation=q.explanation,
        )
        db.add(db_q)

    db.commit()
    db.refresh(db_quiz)
    return db_quiz


def get_quiz_by_id(db: Session, quiz_id: int) -> Optional[Quiz]:
    """Retrieve quiz by ID."""
    return db.query(Quiz).filter(Quiz.id == quiz_id).first()


def record_quiz_score(
    db: Session,
    quiz_id: int,
    score: int,
    weak_topic: Optional[str] = None,
) -> Optional[Quiz]:
    """Update quiz with final score and identified weak topic."""
    quiz = get_quiz_by_id(db, quiz_id)
    if not quiz:
        return None

    quiz.score = score
    if weak_topic:
        quiz.weak_topic = weak_topic

    db.commit()
    db.refresh(quiz)
    return quiz


# ---------------------------------------------------------------------------
# Concept Mastery (DKT) CRUD
# ---------------------------------------------------------------------------
def get_concept_mastery_list(db: Session, user_id: Optional[int] = None) -> List[ConceptMastery]:
    """Retrieve all mastery ratings."""
    query = db.query(ConceptMastery)
    if user_id is not None:
        query = query.filter(ConceptMastery.user_id == user_id)
    return query.all()


def upsert_concept_mastery(
    db: Session,
    subject: str,
    topic: str,
    mastery_score: float,
    decay_risk: float,
    user_id: Optional[int] = None,
) -> ConceptMastery:
    """Update existing mastery record or insert a new one."""
    record = (
        db.query(ConceptMastery)
        .filter(
            ConceptMastery.subject == subject,
            ConceptMastery.topic == topic,
            ConceptMastery.user_id == user_id,
        )
        .first()
    )

    if record:
        record.mastery_score = max(0.0, min(1.0, mastery_score))
        record.decay_risk = max(0.0, min(1.0, decay_risk))
        record.last_reviewed_at = datetime.utcnow()
    else:
        record = ConceptMastery(
            subject=subject,
            topic=topic,
            mastery_score=max(0.0, min(1.0, mastery_score)),
            decay_risk=max(0.0, min(1.0, decay_risk)),
            user_id=user_id,
            last_reviewed_at=datetime.utcnow(),
        )
        db.add(record)

    db.commit()
    db.refresh(record)
    return record
