import requests
import os
from datetime import datetime
from supabase import create_client, Client


def send_canvas_to_supabase(user_id, CANVAS_TOKEN):
   # SUPABASE CONFIG
   SUPABASE_URL = os.getenv(SUPABASE_URL)
   SUPABASE_KEY = os.getenv(SUPABASE_KEY)


   supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


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
       results = []
       while url:
           r = requests.get(url, headers=HEADERS)
           r.raise_for_status()
           results.extend(r.json())
           url = r.links.get("next", {}).get("url")
       return results


   # GET COURSES
   courses = get_paginated(f"{CANVAS_BASE_URL}/api/v1/courses")


   # GET ASSIGNMENTS & SEND TO SUPABASE
   for course in courses:
       course_id = course["id"]
       course_name = course.get("name", "Unnamed Course")
       try:
           assignments = get_paginated(
               f"{CANVAS_BASE_URL}/api/v1/courses/{course_id}/assignments"
           )
       except requests.exceptions.HTTPError as e:
           if e.response.status_code != 403:
               raise
       if not assignments:
           continue
       assignment_id_increment = 0
       for a in assignments:
           assignment_id_increment += 1
           if not a.get("due_at"):
               continue


           due_date = format_date(a["due_at"])


           # Prepare record for Supabase
           assignment_record = {
               "user_id": user_id,
               "course_name": course_name,
               "assignment_id": assignment_id_increment,
               "assignment_name": a["name"],
               "due_date": due_date,
               "points_possible": a.get("points_possible"),
               "retrieved_at": datetime.utcnow().isoformat(),
               "status": False,
               "platform": "Canvas"
           }


           # Insert into Supabase
           try:
               response = supabase.table("assignments_duplicate").upsert(assignment_record, on_conflict=id).execute()
           except Exception as e:
               print("Supabase insert exception:", e)
