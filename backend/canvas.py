import requests
import os
from datetime import datetime, timezone
from supabase import create_client, Client


import sys
from pathlib import Path

from supabase import create_client, Client

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import supabase

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
   def get_active_classes(courses):
        # Get current time in UTC to match Canvas format
        curr_date = datetime.now(timezone.utc)
        active_courses = []
        for course in courses:
            term = course.get('term')
            if not term:
                continue
                
            end_at_str = term.get('end_at')       
            if end_at_str is None:
                active_courses.append(course)
                continue
            
            # Convert Canvas string to datetime object
            # Canvas uses 'Z' for UTC; replace with '+00:00' for older Python versions if needed
            end_at = datetime.fromisoformat(end_at_str.replace('Z', '+00:00'))        
            if end_at > curr_date:
                active_courses.append(course)
        return active_courses


   # GET COURSES
   courses = get_paginated(f"{CANVAS_BASE_URL}/api/v1/courses?include[]=term")
   courses = get_active_classes(courses)

   # GET ASSIGNMENTS & SEND TO SUPABASE
   for course in courses:
       print("COURSE")
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
               "assignment_id": f"{user_id} canvas {a["id"]}",
               "assignment_name": a["name"],
               "due_date": due_date,
               "points_possible": a.get("points_possible"),
               "retrieved_at": datetime.utcnow().isoformat(),
               "status": False,
               "platform": "Canvas"
           }

           print("GOING TO INSERT TO SUPABSER FROM CANVSA")
           # Insert into Supabase
           try:
               response = supabase.table("assignments_duplicate").upsert(assignment_record, on_conflict="assignment_id").execute()
           except Exception as e:
               print("Supabase insert exception:", e)
