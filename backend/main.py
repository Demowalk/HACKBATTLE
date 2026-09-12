from fastapi import FastAPI

app = FastAPI()

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