# Shared by the Canvas, Gradescope and Piazza scrapers so they all agree on
# which classes count as "current".

import re
from datetime import datetime, timedelta, timezone

import requests

CANVAS_BASE_URL = "https://canvas.cmu.edu"

# Include next semester's classes this many days before they start, so
# early-posted assignments show up.
UPCOMING_TERM_WINDOW = timedelta(days=14)


def parse_canvas_date(date_str):
    if not date_str:
        return None
    return datetime.fromisoformat(date_str.replace("Z", "+00:00"))


# CMU course numbers are 5 digits, written "21-241". Canvas has "21241",
# Piazza "21241-12", Gradescope "21-241 F26"; all become "21-241".
COURSE_NUMBER = re.compile(r"(?<!\d)(\d{2})-?(\d{3})(?!\d)")


def course_number(*texts):
    for text in texts:
        match = COURSE_NUMBER.search(text or "")
        if match:
            return f"{match.group(1)}-{match.group(2)}"
    return None


def course_label(canvas_course):
    """How a Canvas course is saved and shown: its number when it has one
    ("21-241"), otherwise its name ("Career Launch - Class of 2029+")."""
    return (
        course_number(canvas_course.get("course_code"), canvas_course.get("name"))
        or canvas_course.get("name", "Unnamed Course")
    )


def is_current_course(course, now):
    term = course.get("term")
    if not term:
        return False

    # Fall back to the course's own dates when the term has none (e.g. "Default Term")
    start = parse_canvas_date(term.get("start_at")) or parse_canvas_date(course.get("start_at"))
    end = parse_canvas_date(term.get("end_at")) or parse_canvas_date(course.get("end_at"))

    if end and end < now:
        return False
    if start and start > now + UPCOMING_TERM_WINDOW:
        return False
    return True


def get_active_courses(canvas_token, session=None):
    # enrollment_state=active drops classes you've finished or dropped
    url = f"{CANVAS_BASE_URL}/api/v1/courses?enrollment_state=active&include[]=term&per_page=100"
    headers = {"Authorization": f"Bearer {canvas_token}"}
    http = session or requests

    courses = []
    while url:
        r = http.get(url, headers=headers)
        r.raise_for_status()
        courses.extend(r.json())
        url = r.links.get("next", {}).get("url")

    now = datetime.now(timezone.utc)
    return [c for c in courses if is_current_course(c, now)]
