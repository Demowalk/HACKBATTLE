import sys
import os
import json
from datetime import datetime
from typing import List, Optional, Dict, Any

from dotenv import load_dotenv
from groq import Groq
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status, Query, Body
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

# Ensure project root is in sys.path so 'database' package can be imported reliably
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Database imports
try:
    from database.connection import get_db, engine, Base, SessionLocal
    from database import models as db_models
    from database import crud, schemas
    DATABASE_AVAILABLE = True
except ImportError:
    DATABASE_AVAILABLE = False


class Subject(BaseModel):
    name: str
    topics: List[str]

class GeneratePlanRequest(BaseModel):
    subjects: List[Subject]
    hours_available: int

class GenerateQuizRequest(BaseModel):
    subject: str
    topic: str
    difficulty: str
    count: int

class QuizAnswer(BaseModel):
    question_id: int
    selected_answer: str

class QuizAnswersRequest(BaseModel):
    answers: List[QuizAnswer]

class ReplanRequest(BaseModel):
    subjects: List[Subject]
    hours_available: int
    weak_subject: str
    weak_topic: str

class UserProfileUpdateRequest(BaseModel):
    fullName: Optional[str] = None
    grade: Optional[str] = None
    streak: Optional[int] = None
    totalStudyMinutes: Optional[int] = None
    targetExam: Optional[str] = None
    dailyGoalMinutes: Optional[int] = None

class CreateTaskRequest(BaseModel):
    title: str
    subject: str
    topic: str
    duration_minutes: int = 60
    priority: str = "medium"
    time_slot: str = "5:00–6:00 PM"
    scheduled_date: str = "2026-09-12"
    alarm_active: bool = True
    is_critical: bool = False
    status_tag: str = "Upcoming"
    user_id: Optional[int] = 1

class ChatMessageRequest(BaseModel):
    sender: str
    text: str
    user_id: Optional[int] = 1

class StudySessionRequest(BaseModel):
    subject: str
    topic: Optional[str] = None
    duration_minutes: int = 25
    session_type: str = "pomodoro"
    user_id: Optional[int] = 1

class ConceptMasteryRequest(BaseModel):
    subject: str
    topic: str
    mastery_score: float
    decay_risk: float = 0.2
    low_proficiency: bool = False
    projected_note: Optional[str] = None
    user_id: Optional[int] = 1

load_dotenv()
# Also check backend/.env if not loaded
backend_env = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)

groq_api_key = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=groq_api_key) if groq_api_key else None
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

def parse_json_response(content: str):
    """Safely parse JSON response from LLM, stripping any surrounding markdown code blocks."""
    text = content.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())

app = FastAPI(title="Reviso Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


tasks = [
    {
        "id": 1,
        "subject": "Maths",
        "topic": "Algebra basics",
        "duration_minutes": 90,
        "priority": "high",
        "completed": False,
        "scheduled_date": "2026-09-13"
    }
]

@app.get("/")
def read_root():
    return {
        "message": "Backend is running",
        "database_connected": DATABASE_AVAILABLE,
        "engine": "Reviso Autonomous Study Engine",
    }

@app.get("/user/profile")
def get_user_profile(
    user_id: Optional[int] = Query(1),
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    """Fetch persistent user profile from database and evaluate daily streak."""
    if DATABASE_AVAILABLE and db:
        user = crud.check_and_update_streak(db, user_id)
        return {
            "id": user.id,
            "username": user.username,
            "fullName": user.full_name,
            "email": user.email,
            "role": user.role,
            "grade": user.grade,
            "streak": user.streak,
            "totalStudyMinutes": user.total_study_minutes,
            "targetExam": user.target_exam,
            "dailyGoalMinutes": user.daily_goal_minutes,
            "lastActiveDate": user.last_active_date,
        }
    return {
        "id": 1,
        "username": "reviso_scholar",
        "fullName": "Laksh HS",
        "email": "scholar@reviso.ai",
        "role": "Student",
        "grade": "Grade 12 / Engineering Prep",
        "streak": 7,
        "totalStudyMinutes": 1260,
        "targetExam": "JEE / Advanced STEM",
        "dailyGoalMinutes": 120,
        "lastActiveDate": datetime.utcnow().strftime("%Y-%m-%d"),
    }

@app.patch("/user/profile")
def update_user_profile_endpoint(
    data: UserProfileUpdateRequest,
    user_id: Optional[int] = Query(1),
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    """Persist updated user profile fields in the database."""
    if DATABASE_AVAILABLE and db:
        updated = crud.update_user_profile(
            db=db,
            user_id=user_id,
            full_name=data.fullName,
            grade=data.grade,
            streak=data.streak,
            total_study_minutes=data.totalStudyMinutes,
            target_exam=data.targetExam,
            daily_goal_minutes=data.dailyGoalMinutes,
        )
        if updated:
            return {
                "id": updated.id,
                "fullName": updated.full_name,
                "grade": updated.grade,
                "streak": updated.streak,
                "totalStudyMinutes": updated.total_study_minutes,
                "targetExam": updated.target_exam,
                "dailyGoalMinutes": updated.daily_goal_minutes,
            }
    return {"id": user_id, "fullName": data.fullName}

@app.get("/tasks")
def get_tasks(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    if DATABASE_AVAILABLE and db:
        try:
            db_tasks = crud.get_tasks(db, user_id=user_id)
            if db_tasks:
                return [
                    {
                        "id": t.id,
                        "title": t.title,
                        "subject": t.subject,
                        "topic": t.topic,
                        "duration_minutes": t.duration_minutes,
                        "priority": t.priority,
                        "timeSlot": t.time_slot,
                        "scheduled_date": t.scheduled_date,
                        "completed": t.completed,
                        "alarmEnabled": t.alarm_active,
                        "isCritical": t.is_critical,
                        "statusTag": t.status_tag,
                    }
                    for t in db_tasks
                ]
        except Exception as e:
            print(f"⚠️ Error fetching from database: {e}")
    return tasks

@app.post("/tasks")
def create_task_endpoint(
    task_data: CreateTaskRequest,
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    """Persist a new task in the database."""
    if DATABASE_AVAILABLE and db:
        try:
            from database.schemas import TaskCreate
            task_in = TaskCreate(
                title=task_data.title,
                subject=task_data.subject,
                topic=task_data.topic,
                duration_minutes=task_data.duration_minutes,
                priority=task_data.priority,
                time_slot=task_data.time_slot,
                scheduled_date=task_data.scheduled_date,
                alarm_active=task_data.alarm_active,
                is_critical=task_data.is_critical,
                status_tag=task_data.status_tag,
                user_id=task_data.user_id,
            )
            created = crud.create_task(db, task_in)
            return {
                "id": created.id,
                "title": created.title,
                "subject": created.subject,
                "topic": created.topic,
                "duration_minutes": created.duration_minutes,
                "priority": created.priority,
                "timeSlot": created.time_slot,
                "scheduled_date": created.scheduled_date,
                "completed": created.completed,
                "alarmEnabled": created.alarm_active,
                "isCritical": created.is_critical,
                "statusTag": created.status_tag,
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    global tasks
    new_id = len(tasks) + 1
    new_task = {
        "id": new_id,
        "title": task_data.title,
        "subject": task_data.subject,
        "topic": task_data.topic,
        "duration_minutes": task_data.duration_minutes,
        "priority": task_data.priority,
        "timeSlot": task_data.time_slot,
        "scheduled_date": task_data.scheduled_date,
        "completed": False,
        "alarmEnabled": task_data.alarm_active,
        "isCritical": task_data.is_critical,
        "statusTag": task_data.status_tag,
    }
    tasks.append(new_task)
    return new_task

@app.patch("/tasks/{id}")
def update_task(id: int, db: Session = Depends(get_db) if DATABASE_AVAILABLE else None):
    if DATABASE_AVAILABLE and db:
        try:
            updated = crud.toggle_task_completion(db, id)
            if updated:
                return {
                    "id": updated.id,
                    "title": updated.title,
                    "subject": updated.subject,
                    "completed": updated.completed,
                    "statusTag": updated.status_tag,
                }
        except Exception as e:
            print(f"⚠️ Error updating task in database: {e}")

    for task in tasks:
        if task["id"] == id:
            task["completed"] = not task.get("completed", False)
            return task
    return {"error": "Task not found"}

@app.delete("/tasks/{id}")
def delete_task_endpoint(
    id: int,
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    """Delete a task permanently from the database."""
    if DATABASE_AVAILABLE and db:
        success = crud.delete_task(db, id)
        return {"success": success, "deleted_id": id}
    global tasks
    tasks = [t for t in tasks if t["id"] != id]
    return {"success": True, "deleted_id": id}

@app.get("/concept-mastery")
def get_concept_mastery_endpoint(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    if DATABASE_AVAILABLE and db:
        records = crud.get_concept_mastery_list(db, user_id=user_id)
        return [
            {
                "id": r.id,
                "subject": r.subject,
                "topic": r.topic,
                "masteryScore": r.mastery_score,
                "decayRisk": r.decay_risk,
                "lowProficiency": r.low_proficiency,
                "projectedNote": r.projected_note,
            }
            for r in records
        ]
    return []

@app.post("/concept-mastery")
def upsert_concept_mastery_endpoint(
    data: ConceptMasteryRequest,
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    """Upsert concept mastery (DKT) score."""
    if DATABASE_AVAILABLE and db:
        rec = crud.upsert_concept_mastery(
            db=db,
            subject=data.subject,
            topic=data.topic,
            mastery_score=data.mastery_score,
            decay_risk=data.decay_risk,
            low_proficiency=data.low_proficiency,
            projected_note=data.projected_note,
            user_id=data.user_id,
        )
        return {
            "id": rec.id,
            "subject": rec.subject,
            "topic": rec.topic,
            "masteryScore": rec.mastery_score,
            "decayRisk": rec.decay_risk,
            "lowProficiency": rec.low_proficiency,
            "projectedNote": rec.projected_note,
        }
    return {"success": True}

@app.get("/critical-actions")
def get_critical_actions_endpoint(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    if DATABASE_AVAILABLE and db:
        actions = crud.get_critical_actions(db, user_id=user_id)
        return [
            {
                "id": a.id,
                "badgeLabel": a.badge_label,
                "descHtml": a.desc_html,
                "btnText": a.btn_text,
                "isScheduled": a.is_scheduled,
                "targetSlot": a.target_slot,
                "actionKey": a.action_key,
            }
            for a in actions
        ]
    return []

@app.post("/critical-actions/{id}/toggle")
def toggle_critical_action_endpoint(
    id: int,
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    """Toggle the scheduled state of a critical remediation alert."""
    if DATABASE_AVAILABLE and db:
        action = crud.toggle_critical_action(db, id)
        if action:
            return {
                "id": action.id,
                "actionKey": action.action_key,
                "isScheduled": action.is_scheduled,
            }
    return {"id": id, "isScheduled": True}

@app.get("/chat/history")
def get_chat_history_endpoint(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    if DATABASE_AVAILABLE and db:
        msgs = crud.get_chat_history(db, user_id=user_id)
        return [
            {
                "id": m.id,
                "sender": m.sender,
                "text": m.text,
                "timestamp": m.timestamp_str,
            }
            for m in msgs
        ]
    return []

@app.post("/chat/message")
def post_chat_message_endpoint(
    msg: ChatMessageRequest,
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    """Persist a conversation message in the database."""
    if DATABASE_AVAILABLE and db:
        saved = crud.add_chat_message(db, sender=msg.sender, text=msg.text, user_id=msg.user_id)
        return {
            "id": saved.id,
            "sender": saved.sender,
            "text": saved.text,
            "timestamp": saved.timestamp_str,
        }
    return {
        "id": 999,
        "sender": msg.sender,
        "text": msg.text,
        "timestamp": datetime.utcnow().strftime("%I:%M %p"),
    }

@app.delete("/chat/history")
def delete_chat_history_endpoint(
    user_id: Optional[int] = Query(1),
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    """Clear conversation history for the student."""
    if DATABASE_AVAILABLE and db:
        count = crud.clear_chat_history(db, user_id=user_id)
        return {"success": True, "deleted_count": count}
    return {"success": True, "deleted_count": 0}

@app.post("/study-sessions")
def create_study_session_endpoint(
    session_data: StudySessionRequest,
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    """Log a completed focus / Pomodoro session and update student study stats & streak."""
    if DATABASE_AVAILABLE and db:
        sess = crud.record_study_session(
            db=db,
            subject=session_data.subject,
            duration_minutes=session_data.duration_minutes,
            topic=session_data.topic,
            session_type=session_data.session_type,
            user_id=session_data.user_id,
        )
        user = crud.check_and_update_streak(db, session_data.user_id or 1)
        return {
            "id": sess.id,
            "subject": sess.subject,
            "durationMinutes": sess.duration_minutes,
            "completedAt": sess.completed_at.isoformat() if sess.completed_at else None,
            "userStreak": user.streak,
            "totalStudyMinutes": user.total_study_minutes,
        }
    return {"success": True, "durationMinutes": session_data.duration_minutes}


def build_prompt(subjects, hours_available):
    subject_list = ""
    for subject in subjects:
        topics_str = ", ".join(subject.topics)
        subject_list += f"- {subject.name}: {topics_str}\n"

    prompt = f"""You are a study planner AI. Create a study schedule based on the following:

Subjects and topics:
{subject_list}

Total hours available: {hours_available}

For each topic, create a task with a subject, topic, duration in minutes, and priority (high/medium/low).
Divide the total hours available reasonably across all topics.
Respond ONLY with a valid JSON array, no other text. Example format:
[
  {{"subject": "Maths", "topic": "Algebra", "duration_minutes": 90, "priority": "high"}}
]
"""
    return prompt

def build_quiz_prompt(subject, topic, difficulty, count):
    prompt = f"""You are a quiz generator AI. Create {count} multiple-choice questions for the subject "{subject}", specifically on the topic "{topic}", at {difficulty} difficulty.

Each question must have exactly 4 options, with only one correct answer.

Respond ONLY with a valid JSON array, no other text. Example format:
[
  {{
    "question": "Solve for x: 2x + 4 = 10",
    "options": ["x=2", "x=3", "x=4", "x=5"],
    "correct_answer": "x=3"
  }}
]
"""
    return prompt

def build_replan_prompt(subjects, hours_available, weak_subject, weak_topic):
    subject_list = ""
    for subject in subjects:
        topics_str = ", ".join(subject.topics)
        subject_list += f"- {subject.name}: {topics_str}\n"

    prompt = f"""You are a study planner AI. Create a study schedule based on the following:

Subjects and topics:
{subject_list}

Total hours available: {hours_available}

The student is performing weak in "{weak_topic}" under the subject "{weak_subject}". Give this topic significantly more time and priority than the others, since it needs more focus.

For each topic, create a task with a subject, topic, duration in minutes, and priority (high/medium/low).
Respond ONLY with a valid JSON array, no other text. Example format:
[
  {{"subject": "Maths", "topic": "Algebra", "duration_minutes": 90, "priority": "high"}}
]
"""
    return prompt


@app.post("/generate-plan")
def generate_plan(request: GeneratePlanRequest):
    if not client:
        return {"error": "GROQ_API_KEY is not configured in environment or .env file."}

    prompt = build_prompt(request.subjects, request.hours_available)

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        ai_reply = response.choices[0].message.content
        ai_tasks = parse_json_response(ai_reply)
    except Exception as e:
        return {"error": "Failed to generate plan. Please try again.", "details": str(e)}

    global tasks
    tasks = []
    next_id = 1
    for ai_task in ai_tasks:
        new_task = {
            "id": next_id,
            "subject": ai_task["subject"],
            "topic": ai_task["topic"],
            "duration_minutes": ai_task["duration_minutes"],
            "priority": ai_task["priority"],
            "completed": False,
            "scheduled_date": "2026-09-13"
        }
        tasks.append(new_task)
        next_id += 1

    return {"tasks": tasks}

quiz_questions = []

@app.post("/generate-quiz")
def generate_quiz(request: GenerateQuizRequest):
    if not client:
        return {"error": "GROQ_API_KEY is not configured in environment or .env file."}

    prompt = build_quiz_prompt(request.subject, request.topic, request.difficulty, request.count)

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        ai_reply = response.choices[0].message.content
        ai_questions = parse_json_response(ai_reply)
    except Exception as e:
        return {"error": "Failed to generate quiz. Please try again.", "details": str(e)}

    global quiz_questions
    quiz_questions = []
    next_id = 1
    for ai_question in ai_questions:
        new_question = {
            "id": next_id,
            "subject": request.subject,
            "topic": request.topic,
            "question": ai_question["question"],
            "options": ai_question["options"],
            "correct_answer": ai_question["correct_answer"]
        }
        quiz_questions.append(new_question)
        next_id += 1

    frontend_questions = []
    for q in quiz_questions:
        frontend_questions.append({
            "id": q["id"],
            "subject": q["subject"],
            "topic": q["topic"],
            "question": q["question"],
            "options": q["options"]
        })

    return {"questions": frontend_questions}

@app.post("/quiz/answer")
def check_quiz_answers(request: QuizAnswersRequest):
    correct_count = 0
    total = len(request.answers)

    for answer in request.answers:
        for question in quiz_questions:
            if question["id"] == answer.question_id:
                if question["correct_answer"] == answer.selected_answer:
                    correct_count += 1

    if correct_count >= (total * 0.7):
        next_difficulty = "hard"
    elif correct_count <= (total * 0.3):
        next_difficulty = "easy"
    else:
        next_difficulty = "medium"

    return {
        "correct_count": correct_count,
        "total": total,
        "next_difficulty": next_difficulty
    }

@app.get("/debug/quiz-answers")
def debug_quiz_answers():
    return quiz_questions

@app.get("/tasks/export-calendar")
def export_calendar():
    ics_lines = ["BEGIN:VCALENDAR", "VERSION:2.0"]
    for task in tasks:
        ics_lines.append("BEGIN:VEVENT")
        ics_lines.append(f"SUMMARY:{task['subject']} - {task['topic']}")
        ics_lines.append(f"DESCRIPTION:Priority: {task['priority']}, Duration: {task['duration_minutes']} minutes")
        ics_lines.append("END:VEVENT")
    ics_lines.append("END:VCALENDAR")

    ics_content = "\n".join(ics_lines)

    return Response(content=ics_content, media_type="text/calendar")

@app.post("/replan")
def replan(request: ReplanRequest):
    if not client:
        return {"error": "GROQ_API_KEY is not configured in environment or .env file."}

    prompt = build_replan_prompt(
        request.subjects,
        request.hours_available,
        request.weak_subject,
        request.weak_topic
    )

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        ai_reply = response.choices[0].message.content
        ai_tasks = parse_json_response(ai_reply)
    except Exception as e:
        return {"error": "Failed to replan. Please try again.", "details": str(e)}

    global tasks
    tasks = []
    next_id = 1
    for ai_task in ai_tasks:
        new_task = {
            "id": next_id,
            "subject": ai_task["subject"],
            "topic": ai_task["topic"],
            "duration_minutes": ai_task["duration_minutes"],
            "priority": ai_task["priority"],
            "completed": False,
            "scheduled_date": "2026-09-13"
        }
        tasks.append(new_task)
        next_id += 1

    return {"tasks": tasks}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)