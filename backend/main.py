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

@app.patch("/tasks/{id}")
def update_task(id: int):
    for task in tasks:
        if task["id"] == id:
            task["completed"] = True
            return task
    return {"error": "Task not found"}
