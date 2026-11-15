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
# Canvas often lists a Gradescope assignment under a slightly different name
# ("HW 3" vs "Homework 3 (Written)"). Canvas never sees the Gradescope
# submission, so that copy would sit in Overdue. Treat them as the same when one
# name contains the other, or they share the same numbers, and they're due
# within this many minutes of each other.
LOOSE_MATCH_MINUTES = 60


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


def numbers_in(name):
    return re.findall(r"\d+", (name or "").lower())


def loosely_same(canvas_row, gradescope_row):
    a = normalize_name(canvas_row["assignment_name"])
    b = normalize_name(gradescope_row["assignment_name"])
    if not a or not b:
        return False
    a_date = parse_date(canvas_row.get("due_date"))
    b_date = parse_date(gradescope_row.get("due_date"))
    if not a_date or not b_date:
        return False
    if abs((a_date - b_date).total_seconds()) > LOOSE_MATCH_MINUTES * 60:
        return False
    contained = len(min(a, b, key=len)) >= 3 and (a in b or b in a)
    a_numbers = numbers_in(canvas_row["assignment_name"])
    same_numbers = bool(a_numbers) and a_numbers == numbers_in(gradescope_row["assignment_name"])
    return contained or same_numbers


class GradescopeIndex:
    """The user's Gradescope assignments, for asking "is this Canvas
    assignment really a Gradescope one?"."""

    def __init__(self, rows):
        self.by_key = {}
        self.by_course = {}
        for row in rows:
            key = (row["course_name"], normalize_name(row["assignment_name"]))
            self.by_key.setdefault(key, []).append(row)
            self.by_course.setdefault(row["course_name"], []).append(row)

    def match(self, canvas_row):
        key = (canvas_row["course_name"], normalize_name(canvas_row["assignment_name"]))
        return next(
            (g for g in self.by_key.get(key, []) if due_dates_close(canvas_row, g)),
            None,
        ) or next(
            (g for g in self.by_course.get(canvas_row["course_name"], []) if loosely_same(canvas_row, g)),
            None,
        )


def load_gradescope_index(user_id, unsaved_gradescope=()):
    """unsaved_gradescope: handed-in Gradescope assignments too old to be
    saved; they still count as the Gradescope copy of a matching Canvas row."""
    response = (
        supabase.table("assignments_duplicate")
        .select("assignment_id, assignment_name, course_name, due_date, status, platform")
        .eq("user_id", user_id)
        .eq("platform", "Gradescope")
        .execute()
    )
    return GradescopeIndex((response.data or []) + [dict(r, unsaved=True) for r in unsaved_gradescope])


def remove_cross_platform_duplicates(user_id, unsaved_gradescope=()):
    """Deletes saved Canvas rows that are copies of Gradescope assignments.

    The sync runs this before saving Canvas (and Canvas then skips those
    copies), so the duplicates never reach the database mid-fetch where the
    popup could load them. It runs once more at the end as a safety net."""
    gradescope = load_gradescope_index(user_id, unsaved_gradescope)
    response = (
        supabase.table("assignments_duplicate")
        .select("assignment_id, assignment_name, course_name, due_date, status")
        .eq("user_id", user_id)
        .eq("platform", "Canvas")
        .execute()
    )

    to_delete = []
    to_mark_done = set()
    for row in response.data or []:
        match = gradescope.match(row)
        if not match:
            continue
        to_delete.append(row["assignment_id"])
        # A Canvas copy the user ticked off: keep it ticked on Gradescope's copy
        if row.get("status") and not match.get("status") and not match.get("unsaved"):
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
