# How long assignments stay in the database. Finished work disappears from the
# inbox after a month (the extension hides it), so it isn't re-saved on every
# fetch, but its row is kept until it's past the semester window: that row is
# what remembers the user ticked it off. Deleting it earlier made the next fetch
# re-add it from Canvas as not done, back in Overdue.

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
    # Only past the window scrapers no longer save (worth_saving), so a
    # deleted row can't come back
    _, any_cutoff = _cutoffs()
    supabase.table("assignments_duplicate").delete().eq("user_id", user_id).lt(
        "due_date", any_cutoff.isoformat()
    ).execute()


def save_assignments(records):
    """Save scraped assignments without ever un-ticking one.

    Each record has "handed_in" (the platform says it's submitted) and a
    "status" that was only used for worth_saving. Writing "status" here would
    overwrite anything the user ticked off while the fetch was running (the
    popup starts one as soon as it opens), so it's left out of the upsert: new
    rows get the column default (not done), existing rows keep their status.
    Then everything the platform says is handed in is marked done.
    """
    if not records:
        return
    rows = [{k: v for k, v in r.items() if k not in ("status", "handed_in")} for r in records]
    # One request per batch instead of one per assignment
    supabase.table("assignments_duplicate").upsert(rows, on_conflict="assignment_id").execute()
    submitted = [r["assignment_id"] for r in records if r.get("handed_in")]
    if submitted:
        supabase.table("assignments_duplicate").update({"status": True}).in_(
            "assignment_id", submitted
        ).execute()
