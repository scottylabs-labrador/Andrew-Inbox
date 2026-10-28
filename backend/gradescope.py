# Scrapes this semester's Gradescope assignments.
#
# Gradescope has no API and CMU students log in through Canvas, so:
#   1. Open ONE Canvas -> Gradescope launch in an invisible Chrome to get logged in.
#   2. Copy the Gradescope cookies into a normal requests session.
#   3. Read every course from the Gradescope account page (this also finds
#      courses that aren't linked from Canvas) and fetch each course page.

import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from gradescopeapi.classes._helpers._assignment_helpers import get_assignments_student_view
from gradescopeapi.classes._helpers._course_helpers import get_courses_info

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import supabase
from courses import CANVAS_BASE_URL, course_label, course_number, get_active_courses

GRADESCOPE_URL = "https://www.gradescope.com"
LOGIN_TIMEOUT = 30  # seconds to wait for the Canvas -> Gradescope login

# Gradescope shows "Submitted", a score like "40.5 / 60.0", or a score glued to
# a lateness note like "3.0 / 4.013 Hours, 17 Minutes Late" for handed-in work,
# and "No Submission" otherwise.
SCORE = re.compile(r"^\s*[\d.]+\s*/\s*(\d+(?:\.\d)?)")


def is_handed_in(status):
    status = (status or "").strip().lower()
    return bool(status) and "no submission" not in status


def max_points(a):
    # The library can't parse late scores, so read the max off the status text
    if a.max_grade is not None:
        return a.max_grade
    match = SCORE.match(a.submissions_status or "")
    return float(match.group(1)) if match else None

SEASON_ORDER = {"spring": 0, "summer": 1, "fall": 2}


# =========================
# HELPERS
# =========================

def normalize(name):
    return re.sub(r"[^a-z0-9]", "", (name or "").lower())


def term_rank(semester, year):
    """Sortable key for a Gradescope term like ("Fall", "2026")."""
    year = int(year) if str(year).isdigit() else 0
    return (year, SEASON_ORDER.get((semester or "").lower(), -1))


def course_name_for(gs_course, canvas_courses):
    """Save Gradescope courses under the same label as Canvas ("21-241"), so
    Canvas/Gradescope duplicates line up and the class filter groups them."""
    number = course_number(gs_course.name, gs_course.full_name)
    if number:
        return number
    # No number on Gradescope: borrow it from the Canvas course with the same name
    gs_names = {normalize(gs_course.full_name), normalize(gs_course.name)} - {""}
    for c in canvas_courses:
        canvas_name = normalize(c.get("name"))
        if canvas_name and any(canvas_name in gs or gs in canvas_name for gs in gs_names):
            return course_label(c)
    return gs_course.full_name or gs_course.name


# =========================
# GRADESCOPE LOGIN (via Canvas LTI)
# =========================

def find_gradescope_launch_url(canvas_token, canvas_courses):
    """Find any current Canvas course with Gradescope in the sidebar."""
    headers = {"Authorization": f"Bearer {canvas_token}"}
    for course in canvas_courses:
        r = requests.get(
            f"{CANVAS_BASE_URL}/api/v1/courses/{course['id']}/external_tools/visible_course_nav_tools",
            headers=headers,
        )
        if r.status_code != 200:
            continue
        for tool in r.json():
            if "gradescope" not in tool.get("name", "").lower():
                continue
            launch = requests.get(
                f"{CANVAS_BASE_URL}/api/v1/courses/{course['id']}/external_tools/sessionless_launch",
                headers=headers,
                params={"url": tool.get("url", "")},
            )
            if launch.status_code == 200 and launch.json().get("url"):
                print(f"Logging in to Gradescope through {course.get('name')}")
                return launch.json()["url"]
    return None


def get_gradescope_session(launch_url):
    """Open the LTI launch in invisible Chrome and copy the login cookies out."""
    options = Options()
    options.add_argument("--headless=new")
    driver = webdriver.Chrome(options=options)
    try:
        driver.get(launch_url)
        # Logged in once Gradescope has handed out its session cookie and we've
        # landed on a real Gradescope page (not the LTI hand-off).
        WebDriverWait(driver, LOGIN_TIMEOUT).until(
            lambda d: "gradescope.com" in d.current_url
            and "/lti" not in d.current_url
            and any(c["name"] == "signed_token" for c in d.get_cookies())
        )
        session = requests.Session()
        for c in driver.get_cookies():
            session.cookies.set(c["name"], c["value"], domain=c.get("domain"))
        return session
    finally:
        driver.quit()


# =========================
# SCRAPE
# =========================

def get_gradescope_assignments(canvas_token):
    """Returns (course_name, Assignment) pairs for this semester's Gradescope courses."""
    canvas_courses = get_active_courses(canvas_token)
    launch_url = find_gradescope_launch_url(canvas_token, canvas_courses)
    if not launch_url:
        print("No Canvas course links to Gradescope; skipping Gradescope")
        return []

    session = get_gradescope_session(launch_url)

    account = session.get(f"{GRADESCOPE_URL}/account")
    account.raise_for_status()
    courses = get_courses_info(BeautifulSoup(account.text, "html.parser"))["student"]
    if not courses:
        print("No Gradescope student courses found")
        return []

    latest = max(term_rank(c.semester, c.year) for c in courses.values())
    current = {cid: c for cid, c in courses.items() if term_rank(c.semester, c.year) == latest}
    print(f"Found {len(current)} Gradescope courses this semester")

    results = []
    for course_id, course in current.items():
        page = session.get(f"{GRADESCOPE_URL}/courses/{course_id}")
        if page.status_code != 200:
            print(f"Skipping Gradescope course {course.name}: HTTP {page.status_code}")
            continue
        assignments = get_assignments_student_view(BeautifulSoup(page.text, "html.parser"))
        course_name = course_name_for(course, canvas_courses)
        print(f"{course_name}: {len(assignments)} Gradescope assignments")
        results.extend((course_name, a) for a in assignments)
    return results


def send_gradescope_to_supabase(user_id, CANVAS_TOKEN):
    assignments = get_gradescope_assignments(CANVAS_TOKEN)

    # Keep whatever the user already checked off; the upsert below would reset it
    existing = (
        supabase.table("assignments_duplicate")
        .select("assignment_id, status")
        .eq("user_id", user_id)
        .eq("platform", "Gradescope")
        .execute()
    )
    checked_ids = {row["assignment_id"] for row in (existing.data or []) if row.get("status")}

    records = []
    for course_name, a in assignments:
        # Closed past assignments have no dates on Gradescope's page; nothing to do
        if not a.assignment_id or not a.due_date:
            continue
        assignment_id = f"{user_id} gradescope {a.assignment_id}"
        handed_in = is_handed_in(a.submissions_status)
        records.append({
            "course_name": course_name,
            "assignment_id": assignment_id,
            "assignment_name": a.name,
            "due_date": a.due_date.isoformat(),
            "points_possible": max_points(a),
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "status": handed_in or assignment_id in checked_ids,
            "platform": "Gradescope",
        })

    if records:
        supabase.table("assignments_duplicate").upsert(records, on_conflict="assignment_id").execute()

    # The old scraper also saved undated rows (in-class quizzes/exams), which the
    # inbox showed as due today
    supabase.table("assignments_duplicate").delete().eq("user_id", user_id).eq(
        "platform", "Gradescope"
    ).is_("due_date", "null").execute()
    print(f"Saved {len(records)} Gradescope assignments")
