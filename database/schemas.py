from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Task Schemas
# ---------------------------------------------------------------------------
class TaskBase(BaseModel):
    title: str
    subject: str
    topic: str
    duration_minutes: int = 60
    priority: str = "medium"  # high, medium, low
    time_slot: str = "5:00–6:00 PM"
    scheduled_date: str = "2026-09-12"
    alarm_active: bool = True
    is_critical: bool = False
    status_tag: str = "Upcoming"


class TaskCreate(TaskBase):
    user_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    duration_minutes: Optional[int] = None
    priority: Optional[str] = None
    time_slot: Optional[str] = None
    scheduled_date: Optional[str] = None
    completed: Optional[bool] = None
    alarm_active: Optional[bool] = None
    is_critical: Optional[bool] = None
    status_tag: Optional[str] = None


class TaskOut(TaskBase):
    id: int
    user_id: Optional[int] = None
    completed: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Quiz Schemas
# ---------------------------------------------------------------------------
class QuizQuestionBase(BaseModel):
    question_text: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None


class QuizQuestionCreate(QuizQuestionBase):
    pass


class QuizQuestionOut(QuizQuestionBase):
    id: int
    selected_answer: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class QuizCreate(BaseModel):
    subject: str
    topic: str
    difficulty: str = "medium"
    questions: List[QuizQuestionCreate]
    user_id: Optional[int] = None


class QuizAnswerSubmit(BaseModel):
    question_id: int
    selected_answer: str


class QuizOut(BaseModel):
    id: int
    subject: str
    topic: str
    difficulty: str
    score: int
    total_questions: int
    weak_topic: Optional[str] = None
    created_at: datetime
    questions: List[QuizQuestionOut] = []

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Concept Mastery (DKT) Schemas
# ---------------------------------------------------------------------------
class ConceptMasteryBase(BaseModel):
    subject: str
    topic: str
    mastery_score: float = 0.5
    decay_risk: float = 0.2
    low_proficiency: bool = False
    projected_note: Optional[str] = None


class ConceptMasteryCreate(ConceptMasteryBase):
    user_id: Optional[int] = None


class ConceptMasteryOut(ConceptMasteryBase):
    id: int
    user_id: Optional[int] = None
    last_reviewed_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Critical Actions / Remediation Alerts Schemas
# ---------------------------------------------------------------------------
class CriticalActionBase(BaseModel):
    badge_label: str = "URGENT"
    desc_html: str
    btn_text: str = "Rebalance Schedule"
    is_scheduled: bool = False
    target_slot: str = "5:30–6:15 PM"
    action_key: str


class CriticalActionCreate(CriticalActionBase):
    user_id: Optional[int] = None


class CriticalActionOut(CriticalActionBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Chat Message Schemas
# ---------------------------------------------------------------------------
class ChatMessageBase(BaseModel):
    sender: str  # 'user' or 'bot'
    text: str
    timestamp_str: Optional[str] = None


class ChatMessageCreate(ChatMessageBase):
    user_id: Optional[int] = None


class ChatMessageOut(ChatMessageBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Study Session (Pomodoro) Schemas
# ---------------------------------------------------------------------------
class StudySessionBase(BaseModel):
    subject: str
    topic: Optional[str] = None
    duration_minutes: int = 25
    session_type: str = "pomodoro"


class StudySessionCreate(StudySessionBase):
    user_id: Optional[int] = None


class StudySessionOut(StudySessionBase):
    id: int
    user_id: Optional[int] = None
    completed_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# User Profile Schemas
# ---------------------------------------------------------------------------
class UserBase(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = "Laksh Scholar"
    role: Optional[str] = "Student"
    grade: Optional[str] = "Grade 12 / Engineering Prep"
    streak: int = 7
    total_study_minutes: int = 1260


class UserCreate(UserBase):
    pass


class UserOut(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
