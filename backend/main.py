import sys
import os
import json
import random
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
    user_id: Optional[int] = 1

class GenerateQuizRequest(BaseModel):
    subject: str
    topic: str
    difficulty: str
    count: int
    user_id: Optional[int] = 1

class QuizAnswer(BaseModel):
    question_id: int
    selected_answer: str

class QuizAnswersRequest(BaseModel):
    answers: List[QuizAnswer]
    quiz_id: Optional[int] = None
    user_id: Optional[int] = 1

class ReplanRequest(BaseModel):
    subjects: List[Subject]
    hours_available: int
    weak_subject: str
    weak_topic: str
    user_id: Optional[int] = 1

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

class ChatAskRequest(BaseModel):
    message: str
    user_id: Optional[int] = 1
    history: Optional[List[Dict[str, Any]]] = None

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

class CriticalRemediationRequest(BaseModel):
    user_id: Optional[int] = 1
    subject: str = "Python"
    topic: str = "Nested Loops & Recursion"
    score: int = 1
    total: int = 5
    scheduled_date: Optional[str] = None
    time_slot: Optional[str] = None
    duration_minutes: Optional[int] = 60

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

@app.on_event("startup")
def on_startup():
    if DATABASE_AVAILABLE:
        try:
            Base.metadata.create_all(bind=engine)
            with SessionLocal() as db:
                crud.get_or_create_default_user(db)
            print("[Reviso Database] Tables and default student profile verified on startup.")
        except Exception as e:
            print(f"[Reviso Database] Startup initialization notice: {e}")

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
            print(f"[Reviso Tasks] Notice fetching from database: {e}")
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
            print(f"[Reviso Tasks] Error updating task in database: {e}")

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

def generate_gpt_copilot_response(prompt: str, user_name: str = "Laksh", history: Optional[List[Dict[str, Any]]] = None) -> str:
    """Generate a high-yield, structured, GPT-like response using Groq or intelligent academic fallback engine."""
    clean_prompt = prompt.strip()
    lower_prompt = clean_prompt.lower()

    # 1. Try Groq LLM completion if available
    if client:
        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are Reviso AI, a world-class AI academic study copilot and mentor for students. "
                        f"You are conversing with {user_name}. Answer questions clearly, accurately, and thoroughly, like ChatGPT.\n\n"
                        "SPECIAL INSTRUCTION FOR STUDY PLANS & PREPARATION:\n"
                        "When a student asks to help them plan their studies or prepare for any subject, exam, or topic (e.g., 'help me plan to study for chemistry', 'plan for python', 'how to study for calculus', 'how should I prepare for physics'):\n"
                        "1. Structure the response into clear phases (Phase 1: Conceptual Foundation, Phase 2: Active Problem Solving & Derivations, Phase 3: Targeted Weak-Spot Remediation, Phase 4: Timed Mocks & Retention Consolidation).\n"
                        "2. Provide EXACT Curated Resources to Use: Specific top textbooks/documentation, high-yield YouTube channels/courses (e.g. 3Blue1Brown, Khan Academy, FreeCodeCamp, Organic Chemistry Tutor, Professor Leonard, Corey Schafer, MIT OCW), interactive platforms (LeetCode, Brilliant, PhET Interactive Simulations, Desmos), and formula sheets/question banks.\n"
                        "3. Detail EXACT Cognitive Methodologies on HOW to Study: Active Recall questioning, Spaced Repetition intervals (Days 1, 3, 7, 14), Feynman Technique checkpoints, Error Logbook analysis, and Pomodoro 25/5 study blocks.\n"
                        "4. Outline a Daily/Weekly Time Distribution and suggest immediate actionable next steps in Reviso.\n\n"
                        "When explaining code or programming, provide clean markdown code blocks with clear comments.\n"
                        "When explaining math, chemistry, or physics, provide step-by-step derivations and formulas.\n"
                        "Use clean markdown with headers, bold highlights, and bullet points. Avoid emojis. Maintain an encouraging and authoritative tone."
                    ),
                }
            ]
            if history:
                for h in history[-6:]:
                    role = "user" if h.get("sender") == "user" else "assistant"
                    text_content = h.get("text", "")
                    # strip any HTML if needed
                    text_content = text_content.replace("<br>", "\n").replace("<strong>", "**").replace("</strong>", "**")
                    messages.append({"role": role, "content": text_content})
            messages.append({"role": "user", "content": clean_prompt})

            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=0.6,
                max_tokens=1200,
            )
            reply = response.choices[0].message.content
            if reply and len(reply.strip()) > 0:
                return reply.strip()
        except Exception as e:
            # Fall through to local intelligent STEM engine
            print(f"[Chat AI] Groq API call note: {e}")

    # 2. Intelligent Multi-Domain Fallback Knowledge Engine
    # Dedicated Study Plan & Preparation Generator
    is_plan_request = any(k in lower_prompt for k in [
        "plan", "study plan", "help me plan", "prepare for", "how to study",
        "how should i study", "how do i study", "how to prepare", "study guide for",
        "strategy for", "roadmap for", "schedule to study"
    ])

    if is_plan_request:
        if any(k in lower_prompt for k in ["chem", "chemistry", "organic", "electrochemistry"]):
            return (
                f"### Comprehensive Chemistry Study Plan for {user_name}\n\n"
                "Here is your structured preparation roadmap with curated resources and proven cognitive study techniques.\n\n"
                "#### 1. Phase-by-Phase Preparation Roadmap\n"
                "- **Phase 1: Conceptual Foundations (Days 1–3):** Atomic structure, periodic trends, chemical bonding, and fundamental laws of thermodynamics.\n"
                "- **Phase 2: Numerical Derivations & Reaction Mechanisms (Days 4–7):** Nernst equation calculations, equilibrium constants ($K_{eq}$), reaction kinetics, and organic electron-pushing mechanisms.\n"
                "- **Phase 3: Active Recall Drills & Weakness Remediation (Days 8–10):** Diagnostic drills on weak subtopics (e.g., redox balancing, $S_N1$ vs $S_N2$) using Reviso's DKT tracker.\n"
                "- **Phase 4: Timed Past Papers & Formula Consolidation (Days 11–14):** Full-length timed mock exams under exam conditions with error analysis.\n\n"
                "#### 2. Exact Resources to Use\n"
                "- **Textbooks & Core References:** *Chemistry: The Central Science* (Brown/LeMay), *Organic Chemistry* (Morrison & Boyd / Wade), *OpenStax Chemistry* (Free online).\n"
                "- **Video Lectures & Channels:** *The Organic Chemistry Tutor* (step-by-step problem sets), *Tyler DeWitt* (crystal-clear concept visualizations), *Khan Academy Chemistry*, *MIT OpenCourseWare 5.111*.\n"
                "- **Interactive Simulators:** *PhET Interactive Simulations* (Atomic Interactions, Balancing Chemical Equations, Acid-Base Solutions), *MolView* (3D molecular modeling).\n"
                "- **Practice & Question Banks:** *LibreTexts Chemistry Question Banks*, *ACS Chemistry Olympiad & Exam Past Papers*, *Reviso Chemistry Concept Quiz Bank*.\n\n"
                "#### 3. Evidence-Based Methodologies: How to Study\n"
                "- **Active Recall Over Re-reading:** Never read passive notes. Convert every textbook section into 3 retrieval questions and answer them from memory.\n"
                "- **Spaced Repetition Schedule:** Revisit challenging reaction mechanisms on **Day 1, Day 3, Day 7, and Day 14** to prevent retention decay.\n"
                "- **Feynman Explanation Technique:** Explain tricky concepts (e.g., Le Chatelier's Principle or Gibb's Free Energy) in simple, non-technical terms to verify full comprehension.\n"
                "- **Mistake Notebook:** Maintain a dedicated log for every problem you miss, classifying errors into *Conceptual Gap*, *Formula Slip*, or *Calculation Error*.\n"
                "- **Pomodoro Timeboxing:** Work in focused 25-minute sprints followed by a 5-minute break. Spend the first 5 minutes of each session recalling key formulas.\n\n"
                "#### 4. Daily Study Schedule (Recommended 2–3 Hours)\n"
                "- **Block 1 (45m):** High-focus concept learning via video + textbook notes.\n"
                "- **Block 2 (45m):** Active numerical practice & mechanism drawing without looking at solutions.\n"
                "- **Block 3 (30m):** Reviso adaptive diagnostic drill + updating your Mistake Notebook.\n\n"
                "**Immediate Next Step:** Would you like me to slot a 30-minute Chemistry Review into your schedule or launch a 5-question baseline drill?"
            )

        if any(k in lower_prompt for k in ["python", "code", "coding", "programming", "dsa", "data structure", "algorithm"]):
            return (
                f"### Complete Python & Programming Mastery Plan for {user_name}\n\n"
                "Here is your step-by-step technical roadmap, authoritative learning resources, and software engineering study methodology.\n\n"
                "#### 1. Phase-by-Phase Preparation Roadmap\n"
                "- **Phase 1: Syntax & Core Constructs (Days 1–3):** Variables, list comprehensions, dictionaries, nested loops, functions, lambda expressions, and file I/O.\n"
                "- **Phase 2: Object-Oriented & Algorithmic Foundations (Days 4–7):** Classes, inheritance, recursion, Big-O time/space complexity analysis, and debugging techniques.\n"
                "- **Phase 3: Core Data Structures & Pattern Drills (Days 8–12):** Two-pointer techniques, sliding window, binary search, stacks, queues, hash maps, and tree traversals.\n"
                "- **Phase 4: Practical Projects & Mock Technical Interviews (Days 13–16):** Building modular CLI / API tools, writing unit tests, and solving timed algorithmic challenges.\n\n"
                "#### 2. Exact Resources to Use\n"
                "- **Documentation & Textbooks:** *Official Python Documentation (docs.python.org)*, *Automate the Boring Stuff with Python* by Al Sweigart, *Grokking Algorithms* by Aditya Bhargava.\n"
                "- **Video Courses & Channels:** *Corey Schafer (Python OOP & Deep Dives)*, *NeetCode (Data Structures & Algorithm Patterns)*, *FreeCodeCamp (Python 4-Hour Course)*, *ArjanCodes (Clean Architecture)*.\n"
                "- **Interactive Platforms:** *LeetCode (Blind 75 & NeetCode 150)*, *PythonTutor.com (Visual Code Execution & Call Stacks)*, *Exercism.org (Mentored Python Track)*.\n"
                "- **Cheat Sheets:** *QuickRef Python 3 Cheatsheet*, *Big-O Cheat Sheet (bigocheatsheet.com)*.\n\n"
                "#### 3. How to Study: Proven Engineering Practice\n"
                "- **The 'Blank Editor' Rule:** Never copy-paste. Type every single algorithm from scratch in an empty editor without autocomplete assistance.\n"
                "- **Dry-Run on Paper:** Trace recursive function calls, stack frames, and index pointers manually on paper before running code.\n"
                "- **Build Small Modular Projects:** Reinforce theory by building working scripts (e.g., web scrapers, automated task schedulers, REST API endpoints).\n"
                "- **Spaced Code Retrieval:** Re-solve algorithms you found difficult after 2 days and 7 days without looking at your previous solution.\n"
                "- **Error Logbook:** Document edge cases you missed (e.g., off-by-one errors, empty input lists, integer division anomalies).\n\n"
                "#### 4. Daily Time Allocation Strategy (2 Hours/Day)\n"
                "- **30 mins:** Concept & Architecture Deep-Dive (Reading docs or tutorial).\n"
                "- **60 mins:** Hands-on Implementation (Writing 2–3 algorithmic problems or building features).\n"
                "- **30 mins:** Code Review, Edge Case Testing & Reviso concept quiz.\n\n"
                "**Immediate Next Step:** Would you like to launch a quick 3-question Python diagnostic drill right now?"
            )

        if any(k in lower_prompt for k in ["math", "calculus", "algebra", "linear algebra", "geometry", "trigonometry", "statistics"]):
            return (
                f"### High-Performance Mathematics Study Plan for {user_name}\n\n"
                "Here is your structured mathematical study roadmap, curated learning resources, and problem-solving methodology.\n\n"
                "#### 1. Phase-by-Phase Preparation Roadmap\n"
                "- **Phase 1: Intuitive Conceptual Visualization (Days 1–3):** Geometric interpretations of limits, derivatives, integrals, and vector spaces.\n"
                "- **Phase 2: Fundamental Proofs & Formula Derivations (Days 4–7):** Deriving core rules from first principles (Power Rule, Chain Rule, Quadratic Formula, Eigenvalues).\n"
                "- **Phase 3: Graduated Problem Solving (Days 8–11):** Tiered problem sets progressing from foundational mechanics to challenging multi-step boundary problems.\n"
                "- **Phase 4: Speed & Timed Exam Drills (Days 12–15):** Solving past exam papers under timed, formula-sheet-free conditions with error categorization.\n\n"
                "#### 2. Exact Resources to Use\n"
                "- **Textbooks & Lecture Notes:** *Thomas' Calculus* / *Stewart Calculus*, *Introduction to Linear Algebra* by Gilbert Strang, *Paul's Online Math Notes (tutorial.math.lamar.edu)*.\n"
                "- **Video Series & Channels:** *3Blue1Brown (Essence of Calculus / Essence of Linear Algebra)*, *Professor Leonard (Full College Calculus Playlists)*, *BlackPenRedPen*, *Khan Academy Math*.\n"
                "- **Interactive Calculators:** *Desmos Graphing Calculator*, *GeoGebra 3D Geometry*, *Wolfram Alpha (for verifying step-by-step derivations)*.\n"
                "- **Question Banks:** *MIT OpenCourseWare 18.01/18.02 Problem Sets*, *Art of Problem Solving (AoPS)*, *Reviso Adaptive Math Drills*.\n\n"
                "#### 3. How to Study: Cognitive Math Protocols\n"
                "- **70/30 Practice-to-Theory Ratio:** Spend 30% of your time understanding concepts and 70% actively solving problems with pencil and paper.\n"
                "- **Derive, Don't Memorize:** If you forget a formula, practice re-deriving it. Derivation builds lasting synaptic connections.\n"
                "- **Error Tagging:** Tag missed problems as: (1) Conceptual Gap, (2) Arithmetic/Sign Slip, or (3) Misread Question. Review the error notebook before each study block.\n"
                "- **Spaced Recall Drills:** Re-attempt hard problems 3 days later to ensure procedural fluency.\n"
                "- **Timeboxed Problem Sprints:** Train yourself to recognize problem patterns within 60 seconds by practicing flashcard problem setups.\n\n"
                "#### 4. Daily Math Study Framework (90–120 mins)\n"
                "- **20 mins:** Review theory, definitions, and derive 1 core formula.\n"
                "- **60 mins:** Active problem solving (10–15 varied difficulty questions).\n"
                "- **20 mins:** Self-grading, error log entry, and formula recap.\n\n"
                "**Immediate Next Step:** Would you like to slot a 25-minute Math focus session into your schedule or review your current retention level?"
            )

        if any(k in lower_prompt for k in ["physics", "mechanics", "kinematics", "optics", "thermodynamics", "electromagnetism"]):
            return (
                f"### Strategic Physics Preparation Plan for {user_name}\n\n"
                "Here is your complete physics roadmap, top textbooks and video resources, and problem-solving framework.\n\n"
                "#### 1. Phase-by-Phase Preparation Roadmap\n"
                "- **Phase 1: Physical Principles & Free Body Diagrams (Days 1–3):** Newton's laws, conservation of energy/momentum, and vector decomposition.\n"
                "- **Phase 2: Multi-Body Systems & Field Equations (Days 4–7):** Rotational mechanics, electromagnetic induction, Snell's law, and thermodynamics.\n"
                "- **Phase 3: Mixed Conceptual Drills (Days 8–11):** Non-standard multi-concept problems combining kinematics with work-energy and calculus.\n"
                "- **Phase 4: Timed Past Exam Papers (Days 12–15):** Complete timed practice tests with strict adherence to dimensional analysis checks.\n\n"
                "#### 2. Exact Resources to Use\n"
                "- **Textbooks & References:** *Fundamentals of Physics* by Halliday, Resnick & Walker, *University Physics* by Young and Freedman, *The Feynman Lectures on Physics*.\n"
                "- **Video Channels & Lectures:** *Walter Lewin Lectures (For the Love of Physics)*, *Flipping Physics*, *Michel van Biezen (iLectureOnline)*, *Khan Academy Physics*.\n"
                "- **Interactive Simulators:** *PhET Physics Simulations* (Forces & Motion, Circuit Construction Kit, Wave Interference, Geometric Optics).\n"
                "- **Problem Banks:** *AP Physics / JEE Advanced Past Papers*, *MIT 8.01 Problem Sets*, *HyperPhysics (Georgia State University)*.\n\n"
                "#### 3. How to Study: The Physics Problem-Solving Framework\n"
                "- **Always Draw a Free Body / System Diagram:** Never start writing equations without a clearly labeled diagram with coordinate axes.\n"
                "- **Symbolic Solving First:** Solve the problem algebraically in terms of variables ($m, v, \theta, g$) before plugging in numbers.\n"
                "- **Dimensional Analysis Check:** Verify that units on both sides of your final formula match before computing numeric answers.\n"
                "- **Boundary / Limiting Case Analysis:** Test extreme values (e.g. $\theta = 0^\circ$ or $m \to \infty$) to check if your equation behaves physically as expected.\n"
                "- **Error Logbook:** Track misapplied friction directions, sign conventions, or missed forces in your review log.\n\n"
                "**Immediate Next Step:** Would you like me to schedule a 30-minute Physics focus session or test your upcoming physics deadlines?"
            )

        # General Study Plan Fallback
        topic_title = clean_prompt.replace("help me plan to study for", "").replace("plan to study for", "").replace("how to study for", "").replace("help me plan for", "").strip() or "Your Target Subject"
        return (
            f"### Comprehensive Study Plan & Resource Guide: {topic_title.title()}\n\n"
            f"Here is your personalized academic roadmap for **{topic_title.title()}**, including top curated resources and proven cognitive study techniques.\n\n"
            "#### 1. Phase-by-Phase Preparation Roadmap\n"
            "- **Phase 1: Conceptual Foundations (Days 1–3):** Build core mental models, key terminology, and fundamental principles.\n"
            "- **Phase 2: Active Problem Solving & Derivations (Days 4–7):** Practice standard problems, write summary sheets, and connect underlying concepts.\n"
            "- **Phase 3: Targeted Weakness Drills (Days 8–10):** Take diagnostic quizzes to pinpoint Lagging concepts and reinforce them via active retrieval.\n"
            "- **Phase 4: Timed Mock Exams & Final Review (Days 11–14):** Simulate full exam conditions with strict timing and comprehensive mistake analysis.\n\n"
            "#### 2. Exact Resources to Use\n"
            "- **Authoritative Textbooks:** Standard university/school curriculum textbooks or OpenStax free open textbooks.\n"
            "- **High-Yield Video Series:** *Khan Academy*, *MIT OpenCourseWare*, *CrashCourse*, and topic-specific masterclass YouTube playlists.\n"
            "- **Interactive Platforms:** *Brilliant.org*, *PhET Interactive Simulations*, and subject flashcard decks (Anki).\n"
            "- **Practice Problem Banks:** Previous year examination papers, textbook end-of-chapter problems, and Reviso adaptive drills.\n\n"
            "#### 3. Evidence-Based Methodologies: How to Study\n"
            "- **Active Recall:** Close your notes and write out everything you remember from memory before checking the answer.\n"
            "- **Spaced Repetition:** Review each concept on Day 1, Day 3, Day 7, and Day 14 to flatten the forgetting curve.\n"
            "- **Feynman Technique:** Teach the concept out loud in plain language to identify gaps in your understanding.\n"
            "- **Mistake Notebook:** Record every error and write out why the correct answer is right and why your initial reasoning failed.\n"
            "- **Pomodoro Timeboxing:** 25-minute high-focus work intervals with zero distractions, followed by a 5-minute cognitive reset.\n\n"
            "#### 4. Daily Schedule Allocation\n"
            "- **25m Focus Block:** Core theory & key insights.\n"
            "- **50m Focus Block:** Active problem solving & application.\n"
            "- **20m Review Block:** Flashcard recall, quiz drill, and error logging.\n\n"
            "**Immediate Next Step:** Would you like to slot a 25-minute focus session into your schedule right now?"
        )

    # A. Python & Programming
    if any(k in lower_prompt for k in ["recursion", "recursive"]):
        return (
            "### Understanding Recursion\n\n"
            "Recursion is a programming technique where a function solves a computational problem by calling itself on smaller sub-problems until reaching a base condition.\n\n"
            "**Key Components of Every Recursive Function:**\n"
            "1. **Base Case:** The termination condition that prevents infinite execution and stack overflow.\n"
            "2. **Recursive Step:** The logic that reduces the problem size toward the base case.\n\n"
            "```python\n"
            "def factorial(n: int) -> int:\n"
            "    # Base case: 0! = 1 and 1! = 1\n"
            "    if n <= 1:\n"
            "        return 1\n"
            "    # Recursive step\n"
            "    return n * factorial(n - 1)\n\n"
            "# Example execution:\n"
            "# factorial(4) -> 4 * factorial(3) -> 4 * 6 = 24\n"
            "print(factorial(4))  # Output: 24\n"
            "```\n\n"
            "**Pro Tip:** Remember that each recursive call consumes stack memory ($O(N)$ space). For deep recursion, consider memoization or an iterative dynamic programming approach."
        )

    if any(k in lower_prompt for k in ["loop", "for loop", "while loop", "nested loop"]):
        return (
            "### Mastering Loops in Python\n\n"
            "Loops allow you to iterate through sequences (lists, tuples, ranges) or repeat execution while a condition remains true.\n\n"
            "**1. For Loops (Definite Iteration):**\n"
            "```python\n"
            "# Iterating over a sequence with enumerate for index access\n"
            "subjects = ['Math', 'Chemistry', 'Python']\n"
            "for idx, subj in enumerate(subjects, start=1):\n"
            "    print(f'{idx}. {subj}')\n"
            "```\n\n"
            "**2. Nested Loops (2D Iteration & Matrices):**\n"
            "```python\n"
            "grid = [[1, 2, 3], [4, 5, 6]]\n"
            "for row in grid:\n"
            "    for val in row:\n"
            "        print(val, end=' ')\n"
            "    print()  # Newline after each row\n"
            "```\n\n"
            "**Complexity Note:** Nested loops over $N$ items run in $O(N^2)$ time. Where possible, use list comprehensions, dictionary lookups ($O(1)$), or hash sets to optimize performance."
        )

    if any(k in lower_prompt for k in ["binary search", "search algorithm"]):
        return (
            "### Binary Search Algorithm\n\n"
            "Binary Search is an optimal searching algorithm on **sorted arrays** that repeatedly divides the search interval in half.\n\n"
            "**Time Complexity:** $O(\\log N)$ vs $O(N)$ for linear search.\n\n"
            "```python\n"
            "def binary_search(arr: list[int], target: int) -> int:\n"
            "    low = 0\n"
            "    high = len(arr) - 1\n\n"
            "    while low <= high:\n"
            "        mid = (low + high) // 2\n"
            "        if arr[mid] == target:\n"
            "            return mid  # Found at index mid\n"
            "        elif arr[mid] < target:\n"
            "            low = mid + 1  # Search right half\n"
            "        else:\n"
            "            high = mid - 1  # Search left half\n"
            "    return -1  # Target not in array\n"
            "```"
        )

    if any(k in lower_prompt for k in ["big o", "time complexity", "space complexity"]):
        return (
            "### Big-O Notation & Computational Complexity\n\n"
            "Big-O notation describes the upper bound of an algorithm's runtime or memory requirements as input size $N$ grows:\n\n"
            "- **$O(1)$ (Constant):** Hash map lookup, array index access.\n"
            "- **$O(\\log N)$ (Logarithmic):** Binary search, balanced BST operations.\n"
            "- **$O(N)$ (Linear):** Single loop traversal, linear search.\n"
            "- **$O(N \\log N)$ (Linearithmic):** Merge Sort, QuickSort (average case), Timsort.\n"
            "- **$O(N^2)$ (Quadratic):** Nested loops, Bubble Sort, Insertion Sort.\n"
            "- **$O(2^N)$ (Exponential):** Naive recursive Fibonacci."
        )

    # B. Mathematics
    if any(k in lower_prompt for k in ["derivative", "differentiation", "calculus", "integral", "integration"]):
        return (
            "### Calculus Principles & Core Rules\n\n"
            "Calculus analyzes continuous change and accumulated area under curves.\n\n"
            "**1. Core Differentiation Rules:**\n"
            "- **Power Rule:** $\\frac{d}{dx}[x^n] = n x^{n-1}$\n"
            "- **Product Rule:** $\\frac{d}{dx}[u \\cdot v] = u'v + uv'$\n"
            "- **Quotient Rule:** $\\frac{d}{dx}\\left[\\frac{u}{v}\\right] = \\frac{u'v - uv'}{v^2}$\n"
            "- **Chain Rule:** $\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$\n\n"
            "**2. Fundamental Theorem of Calculus:**\n"
            "$$\\int_a^b f(x)\\,dx = F(b) - F(a) \\quad \\text{where } F'(x) = f(x)$$\n\n"
            "Would you like to step through a specific equation or derivative?"
        )

    if any(k in lower_prompt for k in ["quadratic", "quadratic equation", "quadratic formula"]):
        return (
            "### Solving Quadratic Equations\n\n"
            "For any standard quadratic equation in the form:\n"
            "$$a x^2 + b x + c = 0 \\quad (a \\neq 0)$$\n\n"
            "The roots are calculated using the **Quadratic Formula**:\n"
            "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\n"
            "**Discriminant ($\\Delta = b^2 - 4ac$):**\n"
            "- $\\Delta > 0$: Two distinct real roots.\n"
            "- $\\Delta = 0$: Exactly one repeated real root ($x = -b/2a$).\n"
            "- $\\Delta < 0$: Two complex conjugate roots."
        )

    if any(k in lower_prompt for k in ["matrix", "matrices", "eigenvalue", "determinant", "linear algebra"]):
        return (
            "### Linear Algebra & Matrix Operations\n\n"
            "**1. Matrix Multiplication:**\n"
            "To multiply matrix $A$ ($m \\times k$) by $B$ ($k \\times n$), each entry is the dot product of row $i$ and column $j$:\n"
            "$$C_{ij} = \\sum_{r=1}^k A_{ir} B_{rj}$$\n\n"
            "**2. Determinant of a $2 \\times 2$ Matrix:**\n"
            "$$\\det \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc$$\n\n"
            "**3. Eigenvalues & Eigenvectors:**\n"
            "Defined by the characteristic equation: $A v = \\lambda v \\iff \\det(A - \\lambda I) = 0$."
        )

    # C. Chemistry & Physics
    if any(k in lower_prompt for k in ["nernst", "electrochemistry", "galvanic", "redox"]):
        return (
            "### Electrochemistry & The Nernst Equation\n\n"
            "The Nernst Equation calculates the reduction potential of an electrochemical reaction under non-standard conditions:\n\n"
            "$$E = E^\\circ - \\frac{RT}{nF} \\ln Q$$\n\n"
            "At standard room temperature ($298.15\\text{ K}$ or $25^\\circ\\text{C}$):\n"
            "$$E = E^\\circ - \\frac{0.0592}{n} \\log_{10} Q$$\n\n"
            "**Parameters:**\n"
            "- $E$: Cell potential under target conditions ($V$).\n"
            "- $E^\\circ$: Standard cell potential ($V$).\n"
            "- $n$: Number of moles of electrons transferred.\n"
            "- $Q$: Reaction quotient $\\left(\\frac{[\\text{Products}]^p}{[\\text{Reactants}]^r}\\right)$."
        )

    # C. Physics & Engineering
    if any(k in lower_prompt for k in ["refraction", "optics", "snell", "light", "reflection", "lens"]):
        return (
            "### Optics & The Law of Refraction\n\n"
            "Refraction is the bending of light as it passes from one optical medium into another with a different refractive index, caused by a change in wave propagation speed.\n\n"
            "**1. Snell's Law of Refraction:**\n"
            "$$n_1 \\sin(\\theta_1) = n_2 \\sin(\\theta_2)$$\n\n"
            "**Key Parameters:**\n"
            "- $n_1, n_2$: Refractive indices of medium 1 and medium 2 ($n = c / v$).\n"
            "- $\\theta_1$: Angle of incidence relative to the normal line.\n"
            "- $\\theta_2$: Angle of refraction relative to the normal line.\n\n"
            "**2. Total Internal Reflection & Critical Angle:**\n"
            "When moving from a denser to a rarer medium ($n_1 > n_2$), if $\\theta_1 > \\theta_c$ where:\n"
            "$$\\theta_c = \\arcsin\\left(\\frac{n_2}{n_1}\\right)$$\n"
            "100% of light is reflected back inside the medium (critical for fiber optics)."
        )

    if any(k in lower_prompt for k in ["thermodynamics", "entropy", "enthalpy", "gibbs"]):
        return (
            "### Thermodynamics & Gibbs Free Energy\n\n"
            "Thermodynamics governs energy transformations and spontaneity in physical and chemical systems.\n\n"
            "**1. The Fundamental Spontaneity Equation:**\n"
            "$$\\Delta G = \\Delta H - T \\Delta S$$\n\n"
            "- $\\Delta G < 0$: Spontaneous (exergonic) process at temperature $T$.\n"
            "- $\\Delta G = 0$: Dynamic equilibrium.\n"
            "- $\\Delta G > 0$: Non-spontaneous (endergonic) process.\n\n"
            "**2. Laws of Thermodynamics:**\n"
            "- **1st Law:** Conservation of Energy ($\\Delta U = Q - W$).\n"
            "- **2nd Law:** Total entropy of an isolated system always increases over time ($\\Delta S_{\\text{universe}} \\ge 0$)."
        )

    if any(k in lower_prompt for k in ["newton", "kinematics", "force", "velocity", "acceleration"]):
        return (
            "### Core Physics: Mechanics & Kinematics\n\n"
            "**Newton's Three Laws of Motion:**\n"
            "1. **Inertia:** An object remains at rest or uniform velocity unless acted upon by a net external force.\n"
            "2. **Force & Acceleration:** $\\vec{F}_{\\text{net}} = m \\vec{a}$\n"
            "3. **Action-Reaction:** For every action, there is an equal and opposite reaction ($\\vec{F}_{AB} = -\\vec{F}_{BA}$).\n\n"
            "**Uniform Acceleration Equations (SUVAT):**\n"
            "- $v = u + at$\n"
            "- $s = ut + \\frac{1}{2}at^2$\n"
            "- $v^2 = u^2 + 2as$"
        )

    # D. Biology & Life Sciences
    if any(k in lower_prompt for k in ["photosynthesis", "chlorophyll", "calvin cycle"]):
        return (
            "### Photosynthesis Mechanism & Energy Conversion\n\n"
            "Photosynthesis converts light energy into chemical energy stored in glucose molecules.\n\n"
            "**Overall Balanced Reaction:**\n"
            "$$6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{photons} \\longrightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$$\n\n"
            "**Two Main Stages:**\n"
            "1. **Light-Dependent Reactions (Thylakoid Membrane):** Photolysis of water generates ATP and NADPH while releasing $\\text{O}_2$.\n"
            "2. **Light-Independent Reactions (Calvin Cycle / Stroma):** Enzyme RuBisCO fixes $\\text{CO}_2$ using ATP/NADPH into G3P to synthesize sugars."
        )

    # E. Study Strategies & DKT Retention
    if any(k in lower_prompt for k in ["study tip", "how to study", "retention", "spaced repetition", "pomodoro", "active recall"]):
        return (
            "### Evidence-Based Cognitive Study Strategies\n\n"
            "Based on cognitive science and Reviso's Deep Knowledge Tracing (DKT) model, here are the highest-yield study methods:\n\n"
            "1. **Active Recall:** Test yourself through questions instead of passively re-reading notes. Active retrieval strengthens synaptic pathways.\n"
            "2. **Spaced Repetition:** Review concepts at increasing intervals (1 day, 3 days, 1 week, 2 weeks) to flatten the Ebbinghaus forgetting curve.\n"
            "3. **Feynman Technique:** Explain complex concepts in plain language as if teaching a beginner. Any friction identifies your exact knowledge gaps.\n"
            "4. **Pomodoro Sprints:** Focus for 25 minutes with zero distractions, followed by a 5-minute break to restore executive attention."
        )

    # F. App Actions & Navigation
    if any(k in lower_prompt for k in ["alarm", "bell"]):
        return "I've triggered your Upcoming Tests & Alarms monitor! You can test audio chime patterns and see your next 3 deadlines."
    if any(k in lower_prompt for k in ["pdf", "export", "share"]):
        return "I've initialized your Print-Ready Study PDF export! You can save or print your daily schedule and concept mastery breakdown."
    if any(k in lower_prompt for k in ["quiz", "drill", "test"]):
        return "I've launched your concept diagnostic drill modal. Answer the first 3 baseline questions to calibrate your adaptive challenge!"

    # G. General Concept Explanation / Assistant Fallback
    return (
        f"### Response to: \"{clean_prompt}\"\n\n"
        f"Here is a structured breakdown regarding **{clean_prompt}**:\n\n"
        "**1. Core Concept Overview:**\n"
        f"When approaching *{clean_prompt}*, it is essential to first identify the fundamental principles and underlying mechanisms. "
        "Breaking down the subject into smaller, testable components prevents cognitive overload and accelerates mastery.\n\n"
        "**2. Key Insights & Step-by-Step Approach:**\n"
        "- **Clarify the Objectives:** Define what inputs or conditions are given and what the final outcome requires.\n"
        "- **Apply Systematic Logic:** Work through the rules sequentially without skipping intermediate reasoning.\n"
        "- **Verify Edge Cases:** Check boundary values, constraint limitations, and formula assumptions.\n\n"
        "**3. Practical Recommendation for Laksh:**\n"
        "Would you like me to generate a dedicated practice problem or schedule a 20-minute deep-focus drill on this topic?"
    )

@app.post("/chat/ask")
def ask_chat_endpoint(
    req: ChatAskRequest,
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    """
    Intelligent AI Copilot endpoint that generates a thorough, GPT-like response
    and records both user query and AI answer in the database.
    """
    user_id = req.user_id or 1
    user_name = "Laksh"
    if DATABASE_AVAILABLE and db:
        user_record = crud.get_user_by_id(db, user_id=user_id)
        if user_record and user_record.full_name:
            user_name = user_record.full_name

    # 1. Persist user's query
    if DATABASE_AVAILABLE and db:
        crud.add_chat_message(db, sender="user", text=req.message, user_id=user_id)

    # 2. Generate GPT-like answer
    ai_reply = generate_gpt_copilot_response(
        prompt=req.message,
        user_name=user_name,
        history=req.history
    )

    # 3. Persist AI response
    if DATABASE_AVAILABLE and db:
        saved_bot = crud.add_chat_message(db, sender="bot", text=ai_reply, user_id=user_id)
        timestamp_str = saved_bot.timestamp_str
    else:
        timestamp_str = datetime.utcnow().strftime("%I:%M %p")

    return {
        "reply": ai_reply,
        "sender": "bot",
        "timestamp": timestamp_str,
        "user_id": user_id
    }

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
def generate_plan(
    request: GeneratePlanRequest,
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    if not request.subjects or request.hours_available <= 0:
        return {"error": "Please provide at least one subject and a positive number of hours."}

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

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    persisted_tasks = []

    if DATABASE_AVAILABLE and db:
        user_id = request.user_id or 1
        for i, ai_task in enumerate(ai_tasks):
            time_slot = f"{9 + (i * 2)}:00–{10 + (i * 2)}:30 AM" if i < 2 else f"{2 + ((i-2)*2)}:00–{3 + ((i-2)*2)}:30 PM"
            task_in = schemas.TaskCreate(
                title=f"{ai_task['subject']}: {ai_task['topic']}",
                subject=ai_task["subject"],
                topic=ai_task["topic"],
                duration_minutes=ai_task["duration_minutes"],
                priority=ai_task.get("priority", "medium"),
                time_slot=time_slot,
                scheduled_date=today_str,
                alarm_active=True,
                status_tag="Upcoming",
                user_id=user_id,
            )
            created = crud.create_task(db, task_in)
            persisted_tasks.append({
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
                "statusTag": created.status_tag,
            })
        return {"tasks": persisted_tasks}

    global tasks
    tasks = []
    next_id = 1
    for ai_task in ai_tasks:
        new_task = {
            "id": next_id,
            "title": f"{ai_task['subject']}: {ai_task['topic']}",
            "subject": ai_task["subject"],
            "topic": ai_task["topic"],
            "duration_minutes": ai_task["duration_minutes"],
            "priority": ai_task["priority"],
            "completed": False,
            "scheduled_date": today_str
        }
        tasks.append(new_task)
        next_id += 1

    return {"tasks": tasks}

# ---------------------------------------------------------------------------
# Curated Question Bank (Zero-API Randomized Pool for Adaptive Testing)
# ---------------------------------------------------------------------------
CURATED_QUESTION_BANK = {
    "python": [
        # --- EASY ---
        {
            "difficulty": "easy",
            "question": "In Python, what is the boolean evaluation of <code>bool([])</code> and <code>bool([0])</code>?",
            "options": ["False and False", "False and True", "True and False", "True and True"],
            "correct_answer": "False and True",
            "explanation": "Empty collections evaluate to False (`bool([]) == False`), while any non-empty list—even containing 0—evaluates to True."
        },
        {
            "difficulty": "easy",
            "question": "What is the output of slicing string <code>s = 'REVISO'[::-1]</code>?",
            "options": ["'OSIVER'", "'REVISO'", "'OSIVER' in lowercase", "'R'"],
            "correct_answer": "'OSIVER'",
            "explanation": "A step parameter of -1 reverses the sequence from end to beginning."
        },
        {
            "difficulty": "easy",
            "question": "What does <code>dict.get('key', 'default')</code> return if <code>'key'</code> is NOT present in the dictionary?",
            "options": ["KeyError", "None", "'default'", "False"],
            "correct_answer": "'default'",
            "explanation": "The .get() method safely retrieves the value for a key, returning the provided fallback value ('default') rather than raising a KeyError."
        },
        {
            "difficulty": "easy",
            "question": "What does the expression <code>len([10, 20, 30, 40])</code> evaluate to?",
            "options": ["3", "4", "5", "40"],
            "correct_answer": "4",
            "explanation": "The len() function returns the number of items in an iterable. There are 4 elements."
        },
        # --- MEDIUM ---
        {
            "difficulty": "medium",
            "question": "What is the evaluated result of the following Python expression?<br><pre style='background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; font-family:monospace;'>[x * 2 for x in range(4) if x % 2 == 1]</pre>",
            "options": ["[0, 2, 4, 6]", "[2, 6]", "[1, 3]", "[4, 8]"],
            "correct_answer": "[2, 6]",
            "explanation": "range(4) produces [0, 1, 2, 3]. The condition `if x % 2 == 1` filters odd numbers: 1 and 3. Then `x * 2` yields [2, 6]."
        },
        {
            "difficulty": "medium",
            "question": "What is the key difference between <code>==</code> and <code>is</code> in Python?",
            "options": [
                "`==` compares values for equality, while `is` compares object identity in memory",
                "`==` checks memory addresses, while `is` checks value equivalence",
                "`is` is only for numerical primitives, `==` is for strings and lists",
                "There is no difference; they are exact aliases"
            ],
            "correct_answer": "`==` compares values for equality, while `is` compares object identity in memory",
            "explanation": "`==` checks if values are equal (invoking __eq__), while `is` checks whether two variables refer to the exact same object (`id(a) == id(b)`)."
        },
        {
            "difficulty": "medium",
            "question": "What will <code>print(type(lambda x: x + 1))</code> display in Python 3?",
            "options": ["<class 'function'>", "<class 'lambda'>", "<class 'method'>", "<class 'closure'>"],
            "correct_answer": "<class 'function'>",
            "explanation": "Lambda expressions create anonymous function objects, which are instances of the standard function type."
        },
        {
            "difficulty": "medium",
            "question": "What does the set operation <code>set_a ^ set_b</code> compute?",
            "options": [
                "Intersection of both sets",
                "Union of both sets",
                "Symmetric difference (elements in either set, but not both)",
                "Cartesian product"
            ],
            "correct_answer": "Symmetric difference (elements in either set, but not both)",
            "explanation": "The caret (^) computes symmetric difference—elements present in either set A or set B, but not in both."
        },
        # --- HARD ---
        {
            "difficulty": "hard",
            "question": "What happens when using a mutable default argument like <code>def append_val(val, target=[])</code> in Python?",
            "options": [
                "A new empty list is created on every function call",
                "The same list instance is shared across all function calls",
                "Python raises a SyntaxError at function definition time",
                "The list automatically clears itself after the function finishes"
            ],
            "correct_answer": "The same list instance is shared across all function calls",
            "explanation": "Default parameter values are evaluated once when the function is defined, meaning mutable containers persist state across subsequent invocations."
        },
        {
            "difficulty": "hard",
            "question": "Which comprehension construct creates a lazy generator expression in memory?",
            "options": [
                "[x**2 for x in range(100)]",
                "(x**2 for x in range(100))",
                "{x**2 for x in range(100)}",
                "{x: x**2 for x in range(100)}"
            ],
            "correct_answer": "(x**2 for x in range(100))",
            "explanation": "Parentheses around a comprehension define a generator expression, yielding items one by one on demand rather than allocating the whole list."
        },
        {
            "difficulty": "hard",
            "question": "Why does an inner function raise <code>UnboundLocalError</code> when referencing outer variable <code>x</code> after <code>x += 1</code> without <code>nonlocal</code>?",
            "options": [
                "Python interprets assignment to x as making it local, shadowing the outer x before binding",
                "Python functions cannot access variables defined outside their body",
                "Augmented assignment is prohibited in Python nested functions",
                "The compiler requires all variables to be statically typed"
            ],
            "correct_answer": "Python interprets assignment to x as making it local, shadowing the outer x before binding",
            "explanation": "Any assignment to a variable within a scope makes it local to that scope throughout the entire function body unless declared nonlocal or global."
        },
        {
            "difficulty": "hard",
            "question": "When stacking decorators <code>@decorator_a</code> above <code>@decorator_b</code> on function <code>f</code>, what is the wrapping order?",
            "options": [
                "decorator_a(decorator_b(f))",
                "decorator_b(decorator_a(f))",
                "Both decorators are executed in parallel",
                "The order is non-deterministic"
            ],
            "correct_answer": "decorator_a(decorator_b(f))",
            "explanation": "Decorators apply from bottom to top: decorator_b wraps f first, and then decorator_a wraps the resulting callable."
        }
    ],
    "maths": [
        # --- EASY ---
        {
            "difficulty": "easy",
            "question": "What are the roots of the quadratic equation: <br><strong style='font-size:16px; display:block; margin-top:6px;'>2x² - 7x + 3 = 0</strong>",
            "options": ["x = 3 and x = 1/2", "x = -3 and x = -1/2", "x = 2 and x = 3", "x = 7 and x = 3"],
            "correct_answer": "x = 3 and x = 1/2",
            "explanation": "Factoring: (2x - 1)(x - 3) = 0. Roots are x = 1/2 and x = 3."
        },
        {
            "difficulty": "easy",
            "question": "What is the slope of the linear equation <code>y = 4x - 9</code>?",
            "options": ["4", "-9", "9/4", "-4"],
            "correct_answer": "4",
            "explanation": "In standard slope-intercept form y = mx + b, the slope m is the coefficient of x, which is 4."
        },
        {
            "difficulty": "easy",
            "question": "What is the determinant of the 2×2 matrix: <br><pre style='background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; font-family:monospace;'>[ 4  2 ]\n[ 3  5 ]</pre>",
            "options": ["14", "26", "20", "6"],
            "correct_answer": "14",
            "explanation": "det(A) = (4 · 5) - (2 · 3) = 20 - 6 = 14."
        },
        {
            "difficulty": "easy",
            "question": "When rolling two fair six-sided dice, what is the probability of the sum being 7?",
            "options": ["1/6", "1/12", "7/36", "5/36"],
            "correct_answer": "1/6",
            "explanation": "There are 36 total outcomes. The pairs summing to 7 are (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) — 6 outcomes. 6/36 = 1/6."
        },
        # --- MEDIUM ---
        {
            "difficulty": "medium",
            "question": "What is the first derivative of <code>f(x) = x³ · e^x</code>?",
            "options": [
                "3x² · e^x",
                "x³ · e^x",
                "e^x · (x³ + 3x²)",
                "3x² · e^(x-1)"
            ],
            "correct_answer": "e^x · (x³ + 3x²)",
            "explanation": "Applying product rule (u·v)' = u'v + uv': (3x²)(e^x) + (x³)(e^x) = e^x(x³ + 3x²)."
        },
        {
            "difficulty": "medium",
            "question": "Evaluate the definite integral: <br><strong style='font-size:16px; display:block; margin-top:6px;'>∫₀² (3x² - 2x + 1) dx</strong>",
            "options": ["6", "8", "4", "10"],
            "correct_answer": "6",
            "explanation": "Antiderivative is F(x) = x³ - x² + x. Evaluated at 2: 8 - 4 + 2 = 6. Evaluated at 0: 0. Difference is 6."
        },
        {
            "difficulty": "medium",
            "question": "What is the value of the trigonometric limit: <br><strong style='font-size:16px; display:block; margin-top:6px;'>lim (x → 0) [ sin(3x) / x ]</strong>",
            "options": ["3", "1", "0", "Undefined"],
            "correct_answer": "3",
            "explanation": "Using lim (u → 0) sin(u)/u = 1: lim [sin(3x)/x] = 3 · lim [sin(3x)/(3x)] = 3 · 1 = 3."
        },
        {
            "difficulty": "medium",
            "question": "What is the Euclidean magnitude of vector <code>v = 3i - 4j + 12k</code>?",
            "options": ["13", "19", "11", "√153"],
            "correct_answer": "13",
            "explanation": "|v| = √(3² + (-4)² + 12²) = √(9 + 16 + 144) = √169 = 13."
        },
        # --- HARD ---
        {
            "difficulty": "hard",
            "question": "Solve for x in: <br><strong style='font-size:16px; display:block; margin-top:6px;'>log₂(x) + log₂(x - 2) = 3</strong>",
            "options": ["x = 4", "x = -2", "x = 4 and x = -2", "x = 8"],
            "correct_answer": "x = 4",
            "explanation": "log₂(x(x - 2)) = 3 → x² - 2x = 8 → x² - 2x - 8 = 0 → (x - 4)(x + 2) = 0. Since log requires positive argument, x = 4."
        },
        {
            "difficulty": "hard",
            "question": "What are the eigenvalues of matrix <br><pre style='background:rgba(0,0,0,0.3); padding:6px; border-radius:6px; font-family:monospace;'>[ 2  1 ]\n[ 1  2 ]</pre>",
            "options": ["λ = 3 and λ = 1", "λ = 2 and λ = 2", "λ = 4 and λ = 0", "λ = 1 and λ = -1"],
            "correct_answer": "λ = 3 and λ = 1",
            "explanation": "det(A - λI) = (2 - λ)² - 1 = λ² - 4λ + 3 = 0 → (λ - 3)(λ - 1) = 0. Roots are λ = 3 and λ = 1."
        },
        {
            "difficulty": "hard",
            "question": "Using L'Hôpital's Rule, evaluate <br><strong style='font-size:16px; display:block; margin-top:6px;'>lim (x → 0) [ (e^x - 1 - x) / x² ]</strong>",
            "options": ["1/2", "1", "0", "Infinity"],
            "correct_answer": "1/2",
            "explanation": "Differentiating numerator and denominator twice: first derivative gives (e^x - 1)/(2x), second gives e^x / 2. As x → 0, e⁰/2 = 1/2."
        }
    ],
    "chemistry": [
        # --- EASY ---
        {
            "difficulty": "easy",
            "question": "What is the oxidation state of Chromium (Cr) in the dichromate ion (Cr₂O₇²⁻)?",
            "options": ["+6", "+3", "+7", "+4"],
            "correct_answer": "+6",
            "explanation": "7 oxygens contribute -14. With net charge -2: 2(Cr) - 14 = -2 → 2(Cr) = +12 → Cr = +6."
        },
        {
            "difficulty": "easy",
            "question": "What is the pH of a 0.001 M HCl solution at 25°C?",
            "options": ["3.0", "1.0", "4.0", "11.0"],
            "correct_answer": "3.0",
            "explanation": "HCl is a strong acid completely dissociating: [H+] = 10⁻³ M. pH = -log₁₀(10⁻³) = 3.0."
        },
        {
            "difficulty": "easy",
            "question": "Which dominant intermolecular force accounts for water's unusually high boiling point compared to H₂S?",
            "options": ["Hydrogen bonding", "London dispersion forces", "Ion-dipole forces", "Covalent network bonding"],
            "correct_answer": "Hydrogen bonding",
            "explanation": "Strong hydrogen bonding between highly electronegative oxygen atoms and hydrogen atoms requires high energy to vaporize."
        },
        # --- MEDIUM ---
        {
            "difficulty": "medium",
            "question": "Which mechanism describes the addition of HBr to an asymmetrical alkene following Markovnikov's rule?",
            "options": [
                "Electrophilic Addition via carbocation intermediate",
                "Nucleophilic Substitution (SN2)",
                "Free Radical Halogenation",
                "Elimination (E1)"
            ],
            "correct_answer": "Electrophilic Addition via carbocation intermediate",
            "explanation": "Electrophiles (H+) attack the π-bond to form the more stable tertiary or secondary carbocation, followed by halide attack."
        },
        {
            "difficulty": "medium",
            "question": "What is the hybridization state of the carbon atoms in ethyne (HC≡CH)?",
            "options": ["sp", "sp²", "sp³", "sp³d"],
            "correct_answer": "sp",
            "explanation": "Each carbon forms two σ-bonds (one to H, one to C) and two π-bonds, yielding linear geometry with sp hybridization."
        },
        {
            "difficulty": "medium",
            "question": "According to Le Chatelier's principle, what happens to <code>N₂(g) + 3H₂(g) ⇌ 2NH₃(g)</code> when system pressure is increased?",
            "options": [
                "Shifts toward products (fewer moles of gas)",
                "Shifts toward reactants (more moles of gas)",
                "No change occurs in equilibrium position",
                "Equilibrium constant K increases"
            ],
            "correct_answer": "Shifts toward products (fewer moles of gas)",
            "explanation": "4 moles of gaseous reactants produce 2 moles of product. Higher pressure favors the side with fewer gas molecules."
        },
        {
            "difficulty": "medium",
            "question": "What is the organic product formed when reducing an aldehyde with sodium borohydride (NaBH₄)?",
            "options": ["Primary alcohol", "Secondary alcohol", "Carboxylic acid", "Ketone"],
            "correct_answer": "Primary alcohol",
            "explanation": "NaBH₄ provides hydride (H⁻) ions to reduce the aldehyde carbonyl group into a primary alcohol (R-CH₂OH)."
        },
        # --- HARD ---
        {
            "difficulty": "hard",
            "question": "What stereochemical outcome occurs at an sp³ chiral center undergoing an bimolecular nucleophilic substitution (SN2) reaction?",
            "options": [
                "Complete Walden inversion of configuration",
                "Complete retention of configuration",
                "Racemization yielding a 50:50 mixture",
                "Formation of a meso compound"
            ],
            "correct_answer": "Complete Walden inversion of configuration",
            "explanation": "In an SN2 reaction, the nucleophile attacks from the backside directly opposite the leaving group, causing a clean inversion of configuration (Walden inversion)."
        },
        {
            "difficulty": "hard",
            "question": "According to the Nernst equation, what happens to cell potential E_cell when reaction quotient Q increases?",
            "options": [
                "E_cell decreases",
                "E_cell increases",
                "E_cell remains constant",
                "Standard potential E°_cell changes"
            ],
            "correct_answer": "E_cell decreases",
            "explanation": "E = E° - (RT/nF)·ln(Q). As Q increases (more products accumulated), the subtractive term grows larger, decreasing cell potential."
        }
    ],
    "ai systems": [
        # --- EASY ---
        {
            "difficulty": "easy",
            "question": "What is the primary role of the Softmax activation function in the output layer of a classifier?",
            "options": [
                "Converts raw logits into a valid probability distribution summing to 1.0",
                "Prevents vanishing gradients in deep recurrent layers",
                "Performs feature dimensionality reduction like PCA",
                "Clips gradient vectors to avoid exploding gradients"
            ],
            "correct_answer": "Converts raw logits into a valid probability distribution summing to 1.0",
            "explanation": "Softmax exponentiates logits and normalizes them so all outputs lie in [0, 1] and sum exactly to 1.0."
        },
        {
            "difficulty": "easy",
            "question": "What problem is primarily indicated when a model achieves 99% accuracy on training data but only 60% on validation data?",
            "options": ["Overfitting", "Underfitting", "Vanishing gradients", "Data leakage"],
            "correct_answer": "Overfitting",
            "explanation": "A wide generalization gap between high training accuracy and low validation accuracy is the hallmark symptom of overfitting."
        },
        # --- MEDIUM ---
        {
            "difficulty": "medium",
            "question": "What is the theoretical time complexity of standard self-attention with sequence length N in a Transformer?",
            "options": ["O(N²)", "O(N log N)", "O(N)", "O(N³)"],
            "correct_answer": "O(N²)",
            "explanation": "The QKᵀ attention matrix calculation computes inner products between all N query and N key vectors, scaling quadratically O(N²)."
        },
        {
            "difficulty": "medium",
            "question": "Why does L1 regularization (Lasso) encourage sparse weights compared to L2 regularization (Ridge)?",
            "options": [
                "Its diamond-shaped constraint has sharp corners on parameter axes, driving weights to exact zeros",
                "L1 penalizes large weights quadratically while ignoring small weights",
                "L1 uses matrix inversion instead of gradient descent",
                "L1 only applies to bias terms, leaving weights unregularized"
            ],
            "correct_answer": "Its diamond-shaped constraint has sharp corners on parameter axes, driving weights to exact zeros",
            "explanation": "The L1 penalty |w| has a constant slope that pushes parameters directly to zero at coordinate axes, producing sparse solutions."
        },
        {
            "difficulty": "medium",
            "question": "What is the primary purpose of Dropout during neural network training?",
            "options": [
                "Prevent co-adaptation of neurons and reduce overfitting",
                "Speed up matrix multiplication during inference",
                "Normalize batch activations to zero mean",
                "Enforce orthogonal weights across layers"
            ],
            "correct_answer": "Prevent co-adaptation of neurons and reduce overfitting",
            "explanation": "Dropout randomly deactivates neurons during training, preventing complex co-adaptations and promoting redundant, generalizable features."
        },
        {
            "difficulty": "medium",
            "question": "In Deep Knowledge Tracing (DKT), how is student knowledge state modeled over time?",
            "options": [
                "A Recurrent Neural Network (LSTM/GRU) updates hidden state vectors as answers are submitted",
                "A static decision tree assigns fixed mastery levels once at registration",
                "A linear regression model computes average completion time only",
                "A k-means clustering model groups students once a month"
            ],
            "correct_answer": "A Recurrent Neural Network (LSTM/GRU) updates hidden state vectors as answers are submitted",
            "explanation": "DKT uses RNN architectures to track the student's evolving latent knowledge state from the temporal sequence of exercises."
        },
        # --- HARD ---
        {
            "difficulty": "hard",
            "question": "In scaled dot-product attention, why is the dot product scaled by 1 / sqrt(d_k)?",
            "options": [
                "To prevent dot products from growing large, which pushes Softmax into regions with extremely small gradients",
                "To enforce unit variance on the attention weights matrix",
                "To speed up GPU tensor core matrix multiplication",
                "To invert the key vectors before projection"
            ],
            "correct_answer": "To prevent dot products from growing large, which pushes Softmax into regions with extremely small gradients",
            "explanation": "For large d_k, dot products grow large in magnitude, pushing softmax into saturation with tiny gradients. Scaling by 1/sqrt(d_k) preserves unit variance."
        },
        {
            "difficulty": "hard",
            "question": "How do Residual Connections (y = F(x) + x) in ResNet prevent the degradation problem in ultra-deep networks?",
            "options": [
                "They allow gradients to propagate directly through the identity shortcut during backpropagation",
                "They double the number of learnable parameters per layer",
                "They eliminate the need for activation functions",
                "They convert non-convex loss surfaces into convex functions"
            ],
            "correct_answer": "They allow gradients to propagate directly through the identity shortcut during backpropagation",
            "explanation": "The identity skip connection allows the gradient dL/dx = dL/dy · (dF/dx + 1) to flow uninterrupted backwards, preventing vanishing gradients."
        }
    ]
}

def get_curated_questions(
    subject: str,
    topic: str = "",
    difficulty: str = "medium",
    count: int = 3
) -> List[Dict[str, Any]]:
    """Sample count distinct randomized questions from the curated bank for the subject and difficulty."""
    sub = (subject or "").lower().strip()
    top = (topic or "").lower().strip()
    diff = (difficulty or "medium").lower().strip()
    if diff not in ["easy", "medium", "hard"]:
        diff = "medium"

    if "math" in sub or "calc" in sub or "algebra" in sub or "math" in top:
        key = "maths"
    elif "chem" in sub or "organic" in sub or "chem" in top:
        key = "chemistry"
    elif "ai" in sub or "cs" in sub or "computer" in sub or "ml" in sub or "ai" in top:
        key = "ai systems"
    else:
        key = "python"

    all_questions = CURATED_QUESTION_BANK.get(key, CURATED_QUESTION_BANK["python"])
    diff_pool = [q for q in all_questions if q.get("difficulty") == diff]
    if len(diff_pool) < count:
        diff_pool = all_questions

    sample_size = max(1, min(count, len(diff_pool)))
    sampled = random.sample(diff_pool, sample_size)
    return [dict(q) for q in sampled]


quiz_questions = []

@app.post("/generate-quiz")
def generate_quiz(
    request: GenerateQuizRequest,
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    requested_count = max(1, min(request.count or 3, 10))
    requested_difficulty = (request.difficulty or "medium").lower().strip()
    if requested_difficulty not in ["easy", "medium", "hard"]:
        requested_difficulty = "medium"
    ai_questions = []

    # 1. If Groq client is configured, attempt AI generation
    if client:
        prompt = build_quiz_prompt(request.subject, request.topic, requested_difficulty, requested_count)
        try:
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}]
            )
            ai_reply = response.choices[0].message.content
            ai_questions = parse_json_response(ai_reply)
        except Exception as e:
            print(f"[QuizGen] Groq generation notice: {e}. Falling back to curated bank.")
            ai_questions = []

    # 2. Fallback to randomized curated question bank if no client or AI failed/empty
    if not ai_questions:
        ai_questions = get_curated_questions(request.subject, request.topic, requested_difficulty, requested_count)

    # 3. Database persistence path
    if DATABASE_AVAILABLE and db:
        quiz_in = schemas.QuizCreate(
            subject=request.subject,
            topic=request.topic,
            difficulty=requested_difficulty,
            user_id=request.user_id or 1,
            questions=[
                schemas.QuizQuestionCreate(
                    question_text=q["question"],
                    options=q["options"],
                    correct_answer=q["correct_answer"],
                    explanation=q.get("explanation", ""),
                )
                for q in ai_questions
            ],
        )
        db_quiz = crud.create_quiz_with_questions(db, quiz_in)
        return {
            "quiz_id": db_quiz.id,
            "subject": db_quiz.subject,
            "topic": db_quiz.topic,
            "difficulty": db_quiz.difficulty,
            "questions": [
                {
                    "id": q.id,
                    "subject": db_quiz.subject,
                    "topic": db_quiz.topic,
                    "question": q.question_text,
                    "options": q.options,
                    "correct_answer": q.correct_answer,
                    "explanation": q.explanation or "",
                    "difficulty": requested_difficulty,
                }
                for q in db_quiz.questions
            ],
        }

    # 4. In-memory fallback path
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
            "correct_answer": ai_question["correct_answer"],
            "explanation": ai_question.get("explanation", ""),
            "difficulty": ai_question.get("difficulty", requested_difficulty),
        }
        quiz_questions.append(new_question)
        next_id += 1

    return {
        "quiz_id": None,
        "subject": request.subject,
        "topic": request.topic,
        "difficulty": requested_difficulty,
        "questions": quiz_questions,
    }

@app.post("/quiz/answer")
def check_quiz_answers(
    request: QuizAnswersRequest,
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    correct_count = 0
    total = len(request.answers)
    quiz_topic = None
    quiz_subject = None

    if DATABASE_AVAILABLE and db:
        for answer in request.answers:
            q = crud.get_quiz_question_by_id(db, answer.question_id)
            if q:
                if not quiz_topic and q.quiz:
                    quiz_topic = q.quiz.topic
                    quiz_subject = q.quiz.subject
                if q.correct_answer.strip().lower() == answer.selected_answer.strip().lower():
                    correct_count += 1
                q.selected_answer = answer.selected_answer
        db.commit()

        if request.quiz_id:
            score_pct = int((correct_count / max(1, total)) * 100)
            weak = quiz_topic if score_pct < 50 else None
            crud.record_quiz_score(db, request.quiz_id, score_pct, weak)

        if quiz_subject and quiz_topic:
            mastery_score = correct_count / max(1, total)
            crud.upsert_concept_mastery(
                db=db,
                subject=quiz_subject,
                topic=quiz_topic,
                mastery_score=mastery_score,
                decay_risk=0.12 if mastery_score >= 0.7 else 0.45,
                low_proficiency=(mastery_score < 0.5),
                projected_note="Solid mastery shown in quiz" if mastery_score >= 0.7 else "Flagged for spaced review",
                user_id=request.user_id or 1,
            )
    else:
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
        "next_difficulty": next_difficulty,
        "score_percentage": int((correct_count / max(1, total)) * 100),
    }

@app.get("/debug/quiz-answers")
def debug_quiz_answers():
    return quiz_questions

def get_curated_youtube_video(subject: str, topic: str) -> dict:
    """Returns verified high-yield YouTube tutorial video metadata for a given topic."""
    s_lower = (subject or "").lower()
    t_lower = (topic or "").lower()

    # Python topics
    if "python" in s_lower or "loop" in t_lower or "comprehension" in t_lower or "async" in t_lower:
        if "async" in t_lower:
            return {
                "title": "Intro to async Python | Writing a Web Crawler",
                "channel": "mCoding",
                "url": "https://www.youtube.com/watch?v=ftmdDlwMwwQ",
            }
        if "comprehension" in t_lower:
            return {
                "title": "Python Tutorial: Comprehensions - How they work & why you should use them",
                "channel": "Corey Schafer",
                "url": "https://www.youtube.com/watch?v=3dt4OGnU5sM",
            }
        return {
            "title": "Python Tutorial for Beginners: Loops and Iterations - For/While Loops",
            "channel": "Corey Schafer",
            "url": "https://www.youtube.com/watch?v=6iF8Xb7Z3wQ",
        }
    
    # Maths topics
    if "math" in s_lower or "algebra" in t_lower or "vector" in t_lower or "matrix" in t_lower:
        return {
            "title": "Vectors & Linear Transformations | Essence of linear algebra",
            "channel": "3Blue1Brown",
            "url": "https://www.youtube.com/watch?v=fNk_zzaMoSs",
        }
    if "calculus" in t_lower or "derivative" in t_lower or "integral" in t_lower:
        return {
            "title": "The Essence of Calculus | Visual Introduction",
            "channel": "3Blue1Brown",
            "url": "https://www.youtube.com/watch?v=WUvTyaaNkzM",
        }

    # Chemistry topics
    if "chem" in s_lower or "reaction" in t_lower or "organic" in t_lower or "nernst" in t_lower:
        if "nernst" in t_lower or "electro" in t_lower:
            return {
                "title": "Nernst Equation Explained, Electrochemistry, Example Problems",
                "channel": "The Organic Chemistry Tutor",
                "url": "https://www.youtube.com/watch?v=jousNNceCXs",
            }
        return {
            "title": "Organic Chemistry Reaction Mechanisms - Addition, Elimination, Substitution",
            "channel": "The Organic Chemistry Tutor",
            "url": "https://www.youtube.com/watch?v=Efh5GkVbhEc",
        }

    # AI / Machine Learning
    if "ai" in s_lower or "transformer" in t_lower or "attention" in t_lower:
        return {
            "title": "Attention in transformers, step-by-step | Deep Learning Chapter 6",
            "channel": "3Blue1Brown",
            "url": "https://www.youtube.com/watch?v=eMlx5fFNoYc",
        }

    # Dynamic Live YouTube Video Lookup
    import urllib.request, urllib.parse, re, ssl
    try:
        ctx = ssl._create_unverified_context()
        search_query = f"{subject} {topic} tutorial masterclass"
        search_url = "https://www.youtube.com/results?search_query=" + urllib.parse.quote(search_query)
        req = urllib.request.Request(
            search_url,
            headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        )
        html = urllib.request.urlopen(req, context=ctx, timeout=3.0).read().decode("utf-8")
        video_ids = re.findall(r'\"videoId\":\"([a-zA-Z0-9_-]{11})\"', html)
        titles = re.findall(r'\"title\":\{\"runs\":\[\{\"text\":\"([^\"]+)\"\}\]', html)
        if video_ids:
            return {
                "title": titles[0] if titles else f"Master {topic} Educational Tutorial",
                "channel": "YouTube Educational Creator",
                "url": f"https://www.youtube.com/watch?v={video_ids[0]}",
            }
    except Exception:
        pass

    import urllib.parse
    query = urllib.parse.quote(f"{subject} {topic} tutorial masterclass")
    return {
        "title": f"Master {topic} Full Educational Walkthrough",
        "channel": "Curated YouTube Tutorial",
        "url": f"https://www.youtube.com/results?search_query={query}",
    }

@app.post("/tasks/schedule-critical-remediation")
def schedule_critical_remediation(
    req: CriticalRemediationRequest,
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    """
    When quiz performance is critical (< 2 correct out of 5), flag topic as critical
    and schedule a study reminder on the earliest following day where schedule is free.
    """
    from datetime import datetime, timedelta

    # Known calendar events/exams to strictly avoid (from calendar system)
    known_exam_dates = {"2026-09-15", "2026-09-28"}
    
    # Check DB tasks if available
    db_tasks_by_date = {}
    if DATABASE_AVAILABLE and db:
        tasks = crud.get_tasks(db, user_id=req.user_id)
        for t in tasks:
            d = t.scheduled_date
            if d:
                db_tasks_by_date[d] = db_tasks_by_date.get(d, 0) + 1
                title_lower = (t.title or "").lower()
                if "exam" in title_lower or "midterm" in title_lower or "finals" in title_lower:
                    known_exam_dates.add(d)

    # Base reference date: today is Sep 12, 2026
    # Scan following 7 days (day + 1 to day + 7)
    base_date = datetime(2026, 9, 12)
    candidate_dates = []
    
    # Static calendar baseline to maintain fidelity with calendar view
    static_counts = {
        "2026-09-13": 2,
        "2026-09-14": 2,
        "2026-09-15": 99,  # Linear Algebra Semester Exam
        "2026-09-16": 0,   # FREE!
        "2026-09-17": 0,   # FREE!
        "2026-09-18": 2,
        "2026-09-19": 1,
    }
    
    for i in range(1, 8):
        day_dt = base_date + timedelta(days=i)
        day_str = day_dt.strftime("%Y-%m-%d")
        task_count = db_tasks_by_date.get(day_str, static_counts.get(day_str, 0))
        is_exam = day_str in known_exam_dates
        candidate_dates.append({
            "date": day_str,
            "dt": day_dt,
            "task_count": task_count,
            "is_exam": is_exam
        })

    # Find the earliest day with 0 tasks and no exam
    free_slot = None
    for cand in candidate_dates:
        if not cand["is_exam"] and cand["task_count"] == 0:
            free_slot = cand
            break
            
    # Fallback to least loaded non-exam day if all have tasks
    if not free_slot:
        non_exam = [c for c in candidate_dates if not c["is_exam"]]
        if non_exam:
            free_slot = min(non_exam, key=lambda x: x["task_count"])
        else:
            free_slot = candidate_dates[0]

    if req.scheduled_date:
        chosen_date_str = req.scheduled_date
        try:
            chosen_day_name = datetime.strptime(req.scheduled_date, "%Y-%m-%d").strftime("%A, %b %d")
        except Exception:
            chosen_day_name = req.scheduled_date
    else:
        chosen_date_str = free_slot["date"]
        chosen_day_name = free_slot["dt"].strftime("%A, %b %d")

    duration_mins = req.duration_minutes or 60
    time_slot = req.time_slot or "4:30–5:30 PM"
    task_title = f"Focused Review: {req.subject} - {req.topic}"

    # 1. Update Concept Mastery in DB if available
    if DATABASE_AVAILABLE and db:
        try:
            crud.upsert_concept_mastery(
                db=db,
                subject=req.subject,
                topic=req.topic,
                mastery_score=0.25,
                decay_risk=0.92,
                low_proficiency=True,
                projected_note="Critical decay risk: scored < 2/5 on adaptive diagnostic quiz. Priority remediation assigned.",
                user_id=req.user_id,
            )
        except Exception as e:
            print(f"[Warning] Failed to upsert concept mastery: {e}")

    # 2. Persist remediation reminder task in DB if available
    created_id = random.randint(5000, 9999)
    if DATABASE_AVAILABLE and db:
        try:
            from database.schemas import TaskCreate
            task_in = TaskCreate(
                title=task_title,
                subject=req.subject,
                topic=req.topic,
                duration_minutes=60,
                priority="high",
                time_slot=time_slot,
                scheduled_date=chosen_date_str,
                alarm_active=True,
                is_critical=True,
                status_tag="Critical Remediation",
                user_id=req.user_id,
            )
            created_task = crud.create_task(db, task_in)
            if created_task:
                created_id = created_task.id
        except Exception as e:
            print(f"[Warning] Failed to persist critical task in DB: {e}")

    return {
        "status": "scheduled",
        "is_critical": True,
        "score": req.score,
        "total": req.total,
        "free_date": chosen_date_str,
        "free_day_name": chosen_day_name,
        "time_slot": time_slot,
        "message": f"Identified {chosen_day_name} as your earliest free day (0 tasks, no exams). Scheduled a 60-min critical remediation drill with reminder alarm enabled.",
        "task": {
            "id": created_id,
            "title": task_title,
            "subject": req.subject,
            "topic": req.topic,
            "duration": "60m",
            "duration_minutes": 60,
            "priority": "high",
            "timeSlot": time_slot,
            "scheduled_date": chosen_date_str,
            "completed": False,
            "alarmEnabled": True,
            "isCritical": True,
            "statusTag": "Critical Remediation",
            "dayNumber": int(chosen_date_str.split("-")[2]),
        },
        "video": get_curated_youtube_video(req.subject, req.topic),
    }


@app.get("/tasks/export-calendar")
def export_calendar(
    user_id: Optional[int] = Query(1),
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
    cal_tasks = []
    if DATABASE_AVAILABLE and db:
        db_tasks = crud.get_tasks(db, user_id=user_id)
        cal_tasks = [
            {
                "id": t.id,
                "title": t.title or t.topic,
                "subject": t.subject,
                "topic": t.topic,
                "priority": t.priority,
                "duration_minutes": t.duration_minutes or 60,
                "scheduled_date": t.scheduled_date or "2026-09-12",
                "time_slot": t.time_slot or "09:00–10:30 AM",
            }
            for t in db_tasks
        ]
    else:
        cal_tasks = tasks

    from datetime import datetime, timezone
    now_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Reviso//Academic Study Calendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Reviso Study Schedule",
        "X-WR-TIMEZONE:UTC",
    ]

    for idx, task in enumerate(cal_tasks):
        tid = task.get("id", idx + 1)
        raw_date = str(task.get("scheduled_date", "2026-09-12")).replace("-", "")
        if len(raw_date) == 8:
            dtstart = f"{raw_date}T090000Z"
            dtend = f"{raw_date}T103000Z"
        else:
            dtstart = f"{now_stamp}"
            dtend = f"{now_stamp}"

        summary = f"{task.get('subject', 'Study')}: {task.get('title') or task.get('topic', 'Practice')}"
        desc = f"Subject: {task.get('subject')}\\nPriority: {task.get('priority', 'medium')}\\nDuration: {task.get('duration_minutes', 60)} min\\nTime Slot: {task.get('time_slot', 'Scheduled')}"

        ics_lines.extend([
            "BEGIN:VEVENT",
            f"UID:reviso-task-{tid}-{raw_date}@reviso.app",
            f"DTSTAMP:{now_stamp}",
            f"DTSTART:{dtstart}",
            f"DTEND:{dtend}",
            f"SUMMARY:{summary}",
            f"DESCRIPTION:{desc}",
            f"CATEGORIES:{task.get('subject', 'Education')}",
            "STATUS:CONFIRMED",
            "BEGIN:VALARM",
            "TRIGGER:-PT15M",
            "ACTION:DISPLAY",
            f"DESCRIPTION:Reminder: {summary}",
            "END:VALARM",
            "END:VEVENT"
        ])

    ics_lines.append("END:VCALENDAR")
    ics_content = "\r\n".join(ics_lines)
    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=reviso_study_schedule.ics"}
    )

@app.post("/replan")
def replan(
    request: ReplanRequest,
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None
):
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

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    persisted_tasks = []

    if DATABASE_AVAILABLE and db:
        user_id = request.user_id or 1
        for i, ai_task in enumerate(ai_tasks):
            is_weak = (ai_task["topic"].lower() == request.weak_topic.lower() or 
                       ai_task["subject"].lower() == request.weak_subject.lower())
            time_slot = f"{9 + (i * 2)}:00–{10 + (i * 2)}:30 AM" if i < 2 else f"{2 + ((i-2)*2)}:00–{3 + ((i-2)*2)}:30 PM"
            task_in = schemas.TaskCreate(
                title=f"{ai_task['subject']}: {ai_task['topic']} (Adaptive Rebalance)",
                subject=ai_task["subject"],
                topic=ai_task["topic"],
                duration_minutes=ai_task["duration_minutes"],
                priority="high" if is_weak else ai_task.get("priority", "medium"),
                time_slot=time_slot,
                scheduled_date=today_str,
                alarm_active=True,
                is_critical=is_weak,
                status_tag="Critical Remediation" if is_weak else "Upcoming",
                user_id=user_id,
            )
            created = crud.create_task(db, task_in)
            persisted_tasks.append({
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
            })
        return {"tasks": persisted_tasks}

    global tasks
    tasks = []
    next_id = 1
    for ai_task in ai_tasks:
        new_task = {
            "id": next_id,
            "title": f"{ai_task['subject']}: {ai_task['topic']}",
            "subject": ai_task["subject"],
            "topic": ai_task["topic"],
            "duration_minutes": ai_task["duration_minutes"],
            "priority": ai_task["priority"],
            "completed": False,
            "scheduled_date": today_str
        }
        tasks.append(new_task)
        next_id += 1

    return {"tasks": tasks}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)