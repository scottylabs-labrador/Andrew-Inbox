import requests
import os
from datetime import datetime, timezone
from supabase import create_client, Client


import sys
from pathlib import Path

from supabase import create_client, Client

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import supabase
from courses import course_label, get_active_courses

def send_canvas_to_supabase(user_id, CANVAS_TOKEN):
   


   # CANVAS CONFIG
   CANVAS_BASE_URL = "https://canvas.cmu.edu"


   HEADERS = {
       "Authorization": f"Bearer {CANVAS_TOKEN}"
   }


   # HELPER FUNCTIONS
   def format_date(date_str):
       if not date_str: return None
       return datetime.fromisoformat(
           date_str.replace("Z", "+00:00")
       ).isoformat()
   def get_paginated(url):
       print("START PAGINATED")
       results = []
       while url:
           r = requests.get(url, headers=HEADERS)
           r.raise_for_status()
           results.extend(r.json())
           url = r.links.get("next", {}).get("url")
       print("END PAGINATED")

       return results
   def handed_in(assignment):
       # Submitted, graded, or excused on Canvas means there's nothing left to do
       submission = assignment.get("submission") or {}
       if (
           submission.get("submitted_at")
           or submission.get("excused")
           or submission.get("workflow_state") in ("submitted", "pending_review", "graded")
       ):
           return True
       # Gradebook-only items (WeBWorK, in-class quizzes, exams) can't be submitted
       # on Canvas, so Canvas never knows they're done. Once their due date has
       # passed, stop showing them as overdue.
       offline = set(assignment.get("submission_types") or []) <= {"none", "on_paper", "not_graded"}
       due = assignment.get("due_at")
       return offline and bool(due) and datetime.fromisoformat(due.replace("Z", "+00:00")) < datetime.now(timezone.utc)


   # GET COURSES
   courses = get_active_courses(CANVAS_TOKEN)

   # Keep whatever the user already checked off; the upsert below would reset it
   existing = (
       supabase.table("assignments_duplicate")
       .select("assignment_id, status")
       .eq("user_id", user_id)
       .eq("platform", "Canvas")
       .execute()
   )
   done_ids = {row["assignment_id"] for row in (existing.data or []) if row.get("status")}

   # GET ASSIGNMENTS & SEND TO SUPABASE
   for course in courses:
       course_id = course["id"]
       course_name = course_label(course)  # "21-241"
       try:
           assignments = get_paginated(
               f"{CANVAS_BASE_URL}/api/v1/courses/{course_id}/assignments?include[]=submission&per_page=100"
           )
       except requests.exceptions.HTTPError as e:
           if e.response.status_code != 403:
               raise
           assignments = []  # no access to this course; don't reuse the last course's list
       if not assignments:
           continue
       records = []
       for a in assignments:
           if not a.get("due_at"):
               continue

           due_date = format_date(a["due_at"])

           # Prepare record for Supabase
           records.append({
               "user_id": user_id,
               "course_name": course_name,
               "assignment_id": f"{user_id} canvas {a["id"]}",
               "assignment_name": a["name"],
               "due_date": due_date,
               "points_possible": a.get("points_possible"),
               "retrieved_at": datetime.utcnow().isoformat(),
               "status": handed_in(a) or f"{user_id} canvas {a["id"]}" in done_ids,
               "platform": "Canvas"
           })

       # One request per course instead of one per assignment
       if records:
           try:
               supabase.table("assignments_duplicate").upsert(records, on_conflict="assignment_id").execute()
           except Exception as e:
               print("Supabase insert exception:", e)
       print(f"{course_name}: saved {len(records)} Canvas assignments")
