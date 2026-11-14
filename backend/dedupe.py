# Removes assignments that show up on both Canvas and Gradescope.
# Runs after every sync. Gradescope wins because it has the submission page,
# and if the user had checked off the Canvas copy, the Gradescope copy is
# checked off too so nothing reappears as unfinished.

import re
import sys
from datetime import datetime
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import supabase

# Same assignment if the names match and the due dates are this close.
MAX_DUE_DATE_GAP_DAYS = 2


def normalize_name(name):
    # "Homework 3 (Written)" and "homework3 - written" should match
    return re.sub(r"[^a-z0-9]", "", (name or "").lower())


def parse_date(date_str):
    if not date_str:
        return None
    return datetime.fromisoformat(date_str.replace("Z", "+00:00"))


def due_dates_close(a, b):
    a_date, b_date = parse_date(a.get("due_date")), parse_date(b.get("due_date"))
    if not a_date or not b_date:
        return True
    return abs((a_date - b_date).days) <= MAX_DUE_DATE_GAP_DAYS


def remove_cross_platform_duplicates(user_id):
    response = (
        supabase.table("assignments_duplicate")
        .select("assignment_id, assignment_name, course_name, due_date, status, platform")
        .eq("user_id", user_id)
        .in_("platform", ["Canvas", "Gradescope"])
        .execute()
    )
    rows = response.data or []

    gradescope_by_key = {}
    for row in rows:
        if row["platform"] == "Gradescope":
            key = (row["course_name"], normalize_name(row["assignment_name"]))
            gradescope_by_key.setdefault(key, []).append(row)

    to_delete = []
    to_mark_done = set()
    for row in rows:
        if row["platform"] != "Canvas":
            continue
        key = (row["course_name"], normalize_name(row["assignment_name"]))
        match = next(
            (g for g in gradescope_by_key.get(key, []) if due_dates_close(row, g)),
            None,
        )
        if not match:
            continue
        to_delete.append(row["assignment_id"])
        if row.get("status") and not match.get("status"):
            to_mark_done.add(match["assignment_id"])

    if to_mark_done:
        supabase.table("assignments_duplicate").update({"status": True}).in_(
            "assignment_id", list(to_mark_done)
        ).execute()
    if to_delete:
        supabase.table("assignments_duplicate").delete().in_(
            "assignment_id", to_delete
        ).execute()

    print(f"Removed {len(to_delete)} Canvas assignments also on Gradescope")
