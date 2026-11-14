# How long assignments stay in the database. Finished work disappears from the
# inbox after a month (the extension deletes it too), so don't keep re-saving it
# on every fetch, and drop anything from long before this semester.

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import supabase

KEEP_DONE_DAYS = 30   # matches KEEP_DONE_DAYS in ui-react/src/dates.ts
KEEP_ANY_DAYS = 120   # roughly one semester


def _cutoffs(now=None):
    now = now or datetime.now(timezone.utc)
    return now - timedelta(days=KEEP_DONE_DAYS), now - timedelta(days=KEEP_ANY_DAYS)


def worth_saving(due_iso, done, now=None):
    """False for assignments the inbox would immediately throw away."""
    if not due_iso:
        return False
    due = datetime.fromisoformat(due_iso.replace("Z", "+00:00"))
    if due.tzinfo is None:
        due = due.replace(tzinfo=timezone.utc)
    done_cutoff, any_cutoff = _cutoffs(now)
    return due >= any_cutoff and not (done and due < done_cutoff)


def delete_stale_assignments(user_id):
    done_cutoff, any_cutoff = _cutoffs()
    table = supabase.table("assignments_duplicate")
    table.delete().eq("user_id", user_id).eq("status", True).lt(
        "due_date", done_cutoff.isoformat()
    ).execute()
    table.delete().eq("user_id", user_id).lt("due_date", any_cutoff.isoformat()).execute()
