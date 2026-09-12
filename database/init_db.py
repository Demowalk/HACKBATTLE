"""Database initialization and initial seed script for reviso."""
import sys
import os

# Add project root to sys.path so it can be run standalone as `python database/init_db.py`
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from database.connection import Base, engine, SessionLocal
from database.models import User, Task, ConceptMastery, CriticalAction, ChatMessage, StudySession



def init_database():
    print("🚀 Initializing Reviso Database Tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")


def seed_demo_data():
    db = SessionLocal()
    try:
        # Check if tasks already exist
        existing_tasks = db.query(Task).count()
        if existing_tasks > 0:
            print(f"ℹ️ Database already contains {existing_tasks} tasks. Skipping initial seeding.")
            return

        print("🌱 Seeding initial demo student and tasks matching frontend state...")

        # 1. Create Default User
        user = User(
            username="reviso_scholar",
            email="scholar@reviso.ai",
            streak=7,
            total_study_minutes=1260,
        )
        db.add(user)
        db.flush()

        # 2. Seed Initial Tasks matching frontend schedule
        initial_tasks = [
            Task(
                user_id=user.id,
                title="Eigenvalues & Diagonalization Practice",
                subject="Maths",
                topic="Linear Algebra",
                duration_minutes=90,
                priority="high",
                time_slot="2:00–3:30 PM",
                scheduled_date="2026-09-12",
                completed=True,
                alarm_active=True,
            ),
            Task(
                user_id=user.id,
                title="Organic Reaction Mechanisms Recap",
                subject="Chemistry",
                topic="Organic Synthesis",
                duration_minutes=60,
                priority="medium",
                time_slot="4:00–5:00 PM",
                scheduled_date="2026-09-12",
                completed=False,
                alarm_active=True,
            ),
            Task(
                user_id=user.id,
                title="Async Programming & Generators",
                subject="Python",
                topic="Concurrency",
                duration_minutes=45,
                priority="low",
                time_slot="5:30–6:15 PM",
                scheduled_date="2026-09-12",
                completed=False,
                alarm_active=True,
            ),
            Task(
                user_id=user.id,
                title="Attention Mechanisms & Transformers",
                subject="AI Systems",
                topic="Deep Learning",
                duration_minutes=60,
                priority="high",
                time_slot="7:00–8:00 PM",
                scheduled_date="2026-09-12",
                completed=False,
                alarm_active=True,
            ),
            # Upcoming milestone tasks
            Task(
                user_id=user.id,
                title="Linear Algebra Semester Exam",
                subject="Maths",
                topic="Full Course Review",
                duration_minutes=180,
                priority="high",
                time_slot="9:00 AM–12:00 PM",
                scheduled_date="2026-09-15",
                completed=False,
                alarm_active=True,
            ),
            Task(
                user_id=user.id,
                title="Organic Chemistry Midterm",
                subject="Chemistry",
                topic="Reaction Mechanisms",
                duration_minutes=120,
                priority="high",
                time_slot="10:00 AM–12:00 PM",
                scheduled_date="2026-09-28",
                completed=False,
                alarm_active=True,
            ),
        ]
        db.add_all(initial_tasks)

        # 3. Seed Concept Mastery Records (DKT retention stats)
        mastery_records = [
            ConceptMastery(
                user_id=user.id,
                subject="Maths",
                topic="Eigenvalues & Matrix Decompositions",
                mastery_score=0.84,
                decay_risk=0.12,
            ),
            ConceptMastery(
                user_id=user.id,
                subject="Chemistry",
                topic="SN1 vs SN2 Nucleophilic Substitution",
                mastery_score=0.65,
                decay_risk=0.28,
            ),
            ConceptMastery(
                user_id=user.id,
                subject="Python",
                topic="AsyncIO Event Loops & Coroutines",
                mastery_score=0.35,
                decay_risk=0.58,
                low_proficiency=True,
                projected_note="Critical decay alert! Requires active recall session.",
            ),
        ]
        db.add_all(mastery_records)

        # 4. Seed Critical Actions (Focus Areas)
        critical_actions = [
            CriticalAction(
                user_id=user.id,
                badge_label="URGENT",
                desc_html="Python AsyncIO retention has dropped to 35% with 58% decay risk.",
                btn_text="Rebalance Schedule",
                is_scheduled=False,
                target_slot="5:30–6:15 PM",
                action_key="python_remediation",
            ),
            CriticalAction(
                user_id=user.id,
                badge_label="UPCOMING EXAM",
                desc_html="Linear Algebra Final Exam is in 3 days (Sep 15). Review formula sheets.",
                btn_text="Add Practice Exam Block",
                is_scheduled=False,
                target_slot="9:00 AM–12:00 PM",
                action_key="math_midterm",
            ),
            CriticalAction(
                user_id=user.id,
                badge_label="CRITICAL REMINDER",
                desc_html="Organic Chemistry lab submission deadline is tomorrow at 5:00 PM.",
                btn_text="View Lab Notes",
                is_scheduled=False,
                target_slot="4:00–5:00 PM",
                action_key="chem_lab",
            ),
        ]
        db.add_all(critical_actions)

        # 5. Seed Initial Chat Messages
        chat_messages = [
            ChatMessage(
                user_id=user.id,
                sender="bot",
                text="Hello Laksh! I am Reviso, your autonomous study copilot. How can I optimize your learning schedule today?",
                timestamp_str="02:00 PM",
            ),
            ChatMessage(
                user_id=user.id,
                sender="user",
                text="Can you review my Python AsyncIO retention score?",
                timestamp_str="02:02 PM",
            ),
            ChatMessage(
                user_id=user.id,
                sender="bot",
                text="Your Python AsyncIO mastery is currently at 35% with high decay danger. I have placed a remediation study block in your schedule for 5:30 PM today!",
                timestamp_str="02:02 PM",
            ),
        ]
        db.add_all(chat_messages)

        db.commit()
        print("🎉 Database seeded with initial student, tasks, mastery, focus areas, and chat messages!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error during database seeding: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
    seed_demo_data()
