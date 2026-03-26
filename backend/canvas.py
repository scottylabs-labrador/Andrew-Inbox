# IMPORTS
import requests
from datetime import datetime
from supabase import create_client, Client

# SUPABASE CONFIG
SUPABASE_URL = "https://hynachiidugrogjvydau.supabase.co"
SUPABASE_KEY = ""

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# CANVAS CONFIG
CANVAS_BASE_URL = "https://canvas.cmu.edu"   # replace with your Canvas domain
CANVAS_TOKEN = ""

HEADERS = {
    "Authorization": f"Bearer {CANVAS_TOKEN}"
}

# HELPER FUNCTIONS
def print_header(title):
    print("\n" + "=" * len(title))
    print(title)
    print("=" * len(title))

def format_date(date_str):
    if not date_str:
        return None
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
print_header("COURSES")
for c in courses:
    print(f"- {c.get('name','Unnamed Course')} (ID: {c['id']})")

# GET ASSIGNMENTS + SEND TO SUPABASE
print_header("ASSIGNMENTS & DUE DATES")
for course in courses:
    course_id = course["id"]
    course_name = course.get("name", "Unnamed Course")
    try:
        assignments = get_paginated(
            f"{CANVAS_BASE_URL}/api/v1/courses/{course_id}/assignments"
        )
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 403:
            print(f"\n{course_name}")
            print("Assignment access blocked")
            continue
        else:
            raise

    if not assignments:
        continue

    print(f"\n{course_name}")
    print("-" * len(course_name))
    assignment_id_increment = 0;
    for a in assignments:
        assignment_id_increment += 1
        if not a.get("due_at"):
            continue

        due_date = format_date(a["due_at"])
        print(f"• {a['name']:<35} | Due: {due_date} | Points: {a.get('points_possible','N/A')}")

        # Prepare record for Supabase
        assignment_record = {
            "user_id": "pnimmaga",
            # "course_id": course_id,
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
            response = supabase.table("assignments_duplicate").insert(assignment_record).execute()
            # if response.get("status_code") not in [200, 201, 204]:
            #     print("Supabase insert failed:", response)
        except Exception as e:
            print("Supabase insert exception:", e)

# ===============================
# GET CURRENT GRADES
# ===============================
print_header("CURRENT GRADES (IF AVAILABLE)")
for course in courses:
    course_id = course["id"]
    course_name = course.get("name", "Unnamed Course")

    r = requests.get(
        f"{CANVAS_BASE_URL}/api/v1/courses/{course_id}?include[]=total_scores",
        headers=HEADERS
    )

    if r.status_code != 200:
        print(f"{course_name:<30} | Grade access blocked")
        continue

    data = r.json()
    enrollments = data.get("enrollments", [])
    if not enrollments or enrollments[0].get("computed_current_score") is None:
        print(f"{course_name:<30} | Grade not released")
    else:
        score = enrollments[0]["computed_current_score"]
        print(f"{course_name:<30} | Current Grade: {score}%")

print_header("DATA EXTRACTION COMPLETE")
print("Canvas data successfully retrieved and sent to Supabase.")