import os
import json
from dotenv import load_dotenv
from groq import Groq
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

class Subject(BaseModel):
    name: str
    topics: List[str]

class GeneratePlanRequest(BaseModel):
    subjects: List[Subject]
    hours_available: int

class GenerateQuizRequest(BaseModel):
    subject: str
    difficulty: str
    count: int

class QuizAnswer(BaseModel):
    question_id: int
    selected_answer: str

class QuizAnswersRequest(BaseModel):
    answers: List[QuizAnswer]

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


app = FastAPI()

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
    return {"message": "Backend is running"}

@app.get("/tasks")
def get_tasks():
    return tasks

@app.patch("/tasks/{id}")
def update_task(id: int):
    for task in tasks:
        if task["id"] == id:
            task["completed"] = True
            return task
    return {"error": "Task not found"}

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

def build_quiz_prompt(subject, difficulty, count):
    prompt = f"""You are a quiz generator AI. Create {count} multiple-choice questions for the subject "{subject}" at {difficulty} difficulty.

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


@app.post("/generate-plan")
def generate_plan(request: GeneratePlanRequest):
    prompt = build_prompt(request.subjects, request.hours_available)

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    ai_reply = response.choices[0].message.content
    ai_tasks = json.loads(ai_reply)

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
    prompt = build_quiz_prompt(request.subject, request.difficulty, request.count)

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    ai_reply = response.choices[0].message.content
    ai_questions = json.loads(ai_reply)

    global quiz_questions
    quiz_questions = []
    next_id = 1
    for ai_question in ai_questions:
        new_question = {
            "id": next_id,
            "subject": request.subject,
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