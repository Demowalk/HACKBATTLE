from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Float,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from .connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    full_name = Column(String(255), default="Laksh Scholar")
    role = Column(String(100), default="Student")
    grade = Column(String(100), default="Grade 12 / Engineering Prep")
    streak = Column(Integer, default=7)
    total_study_minutes = Column(Integer, default=1260)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    concept_masteries = relationship("ConceptMastery", back_populates="user", cascade="all, delete-orphan")
    critical_actions = relationship("CriticalAction", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    study_sessions = relationship("StudySession", back_populates="user", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    subject = Column(String(100), nullable=False, index=True)  # Maths, Chemistry, Python, AI Systems
    topic = Column(String(255), nullable=False)
    duration_minutes = Column(Integer, default=60)
    priority = Column(String(20), default="medium")  # high, medium, low
    time_slot = Column(String(100), default="5:00–6:00 PM")
    scheduled_date = Column(String(20), default="2026-09-12", index=True)  # YYYY-MM-DD
    completed = Column(Boolean, default=False, index=True)
    alarm_active = Column(Boolean, default=True)
    is_critical = Column(Boolean, default=False)
    status_tag = Column(String(50), default="Upcoming")  # Upcoming, Done, Critical Remediation
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="tasks")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    subject = Column(String(100), nullable=False)
    topic = Column(String(255), nullable=False)
    difficulty = Column(String(50), default="medium")  # easy, medium, hard
    score = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    weak_topic = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # ["A) ...", "B) ...", "C) ...", "D) ..."]
    correct_answer = Column(String(255), nullable=False)
    selected_answer = Column(String(255), nullable=True)
    explanation = Column(Text, nullable=True)

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")


class ConceptMastery(Base):
    __tablename__ = "concept_mastery"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    subject = Column(String(100), nullable=False, index=True)
    topic = Column(String(255), nullable=False, index=True)
    mastery_score = Column(Float, default=0.5)  # 0.0 to 1.0 (e.g. 0.84 = 84%)
    decay_risk = Column(Float, default=0.2)  # 0.0 to 1.0 (e.g. 0.35 = 35% decay danger)
    low_proficiency = Column(Boolean, default=False)
    projected_note = Column(String(255), nullable=True)
    last_reviewed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="concept_masteries")


class CriticalAction(Base):
    __tablename__ = "critical_actions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    badge_label = Column(String(50), default="URGENT")  # URGENT, UPCOMING EXAM, CRITICAL REMINDER
    desc_html = Column(Text, nullable=False)
    btn_text = Column(String(100), default="Rebalance Schedule")
    is_scheduled = Column(Boolean, default=False)
    target_slot = Column(String(100), default="5:30–6:15 PM")
    action_key = Column(String(100), nullable=False)  # python_remediation, math_midterm, chem_lab
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="critical_actions")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    sender = Column(String(20), nullable=False)  # 'user' or 'bot'
    text = Column(Text, nullable=False)
    timestamp_str = Column(String(50), default=datetime.utcnow().strftime("%I:%M %p"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="chat_messages")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    subject = Column(String(100), nullable=False)
    topic = Column(String(255), nullable=True)
    duration_minutes = Column(Integer, default=25)  # Pomodoro duration
    session_type = Column(String(50), default="pomodoro")  # pomodoro, deep_work, quiz
    completed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="study_sessions")
