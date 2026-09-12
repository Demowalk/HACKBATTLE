"""Supabase REST & Realtime Client for Reviso."""
import os
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = Any

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))

_supabase_client: Optional[Client] = None


def get_supabase() -> Optional[Client]:
    """Returns a singleton instance of the Supabase Client if credentials are provided."""
    global _supabase_client
    if not SUPABASE_AVAILABLE:
        return None
    if _supabase_client is not None:
        return _supabase_client

    if SUPABASE_URL and SUPABASE_KEY:
        try:
            _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            return _supabase_client
        except Exception as e:
            print(f"⚠️ Failed to initialize Supabase client: {e}")
            return None
    return None


# ---------------------------------------------------------------------------
# Supabase Direct REST Helper Functions
# ---------------------------------------------------------------------------
def supabase_fetch_tasks(scheduled_date: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetch tasks from Supabase 'tasks' table."""
    sb = get_supabase()
    if not sb:
        return []
    query = sb.table("tasks").select("*")
    if scheduled_date:
        query = query.eq("scheduled_date", scheduled_date)
    res = query.order("id").execute()
    return res.data or []


def supabase_insert_task(task_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Insert a new task directly into Supabase."""
    sb = get_supabase()
    if not sb:
        return None
    res = sb.table("tasks").insert(task_data).execute()
    return res.data[0] if res.data else None


def supabase_toggle_task(task_id: int, completed: bool) -> Optional[Dict[str, Any]]:
    """Toggle a task's completion status."""
    sb = get_supabase()
    if not sb:
        return None
    res = sb.table("tasks").update({"completed": completed}).eq("id", task_id).execute()
    return res.data[0] if res.data else None


def supabase_fetch_concept_mastery() -> List[Dict[str, Any]]:
    """Fetch DKT mastery records."""
    sb = get_supabase()
    if not sb:
        return []
    res = sb.table("concept_mastery").select("*").execute()
    return res.data or []
