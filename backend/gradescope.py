# Scrapes this semester's Gradescope assignments.
#
# Gradescope has no API and CMU students log in through Canvas, so:
#   1. Open ONE Canvas -> Gradescope launch in an invisible Chrome to get logged in.
#   2. Copy the Gradescope cookies into a normal requests session.
#   3. Read every course from the Gradescope account page (this also finds
#      courses that aren't linked from Canvas) and fetch each course page.

import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import dateutil.parser
import requests
from bs4 import BeautifulSoup
from selenium.webdriver.support.ui import WebDriverWait

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import supabase
from chrome_driver import new_chrome
from courses import CANVAS_BASE_URL, course_label, course_number, get_active_courses
from retention import save_assignments, worth_saving

GRADESCOPE_URL = "https://www.gradescope.com"
LOGIN_TIMEOUT = 30  # seconds to wait for the Canvas -> Gradescope login

# Gradescope shows "Submitted", a score like "40.5 / 60.0", or a score glued to
# a lateness note like "3.0 / 4.013 Hours, 17 Minutes Late" for handed-in work,
# and "No Submission" otherwise.
SCORE = re.compile(r"^\s*[\d.]+\s*/\s*(\d+(?:\.\d)?)")
# The assignment link points at your submission once you've handed something in:
# /courses/123/assignments/456/submissions/789
SUBMISSION_LINK = re.compile(r"/assignments/(\d+)/submissions/\d+")
ASSIGNMENT_LINK = re.compile(r"/assignments/(\d+)")


@dataclass
class GradescopeAssignment:
    assignment_id: str | None
    name: str
    due_date: datetime | None
    status_text: str
    handed_in: bool
    max_points: float | None


def is_handed_in(status):
    status = (status or "").strip().lower()
    return bool(status) and "no submission" not in status


def parse_course_page(soup):
    """Read the assignments table on a student's Gradescope course page.

    gradescopeapi's parser drops the table's first and last <tr role="row">
    blindly (header + an upload-preview row). When that preview row isn't on
    the page, the last real assignment vanished and its saved row never got
    marked submitted, so this looks at each row instead.
    """
    assignments = []
    for row in soup.find_all("tr"):
        if row.find_parent("thead"):
            continue
        header = row.find("th")
        if not header or "dropzonePreview" in " ".join(header.get("class", [])):
            continue

        link = header.find("a", href=True)
        button = header.find(attrs={"data-assignment-id": True})
        href = link["href"] if link else ""
        submitted_link = SUBMISSION_LINK.search(href)
        if submitted_link:
            assignment_id = submitted_link.group(1)
        elif button:
            assignment_id = button["data-assignment-id"]
        elif ASSIGNMENT_LINK.search(href):
            assignment_id = ASSIGNMENT_LINK.search(href).group(1)
        else:
            assignment_id = None

        status_cell = row.find("td", class_=re.compile("submissionStatus")) or row.find("td")
        status_text = status_cell.get_text(" ", strip=True) if status_cell else ""
        score = SCORE.match(status_text)

        due_tags = row.find_all(class_="submissionTimeChart--dueDate")
        due_attr = due_tags[0].get("datetime") if due_tags else None
        try:
            due_date = dateutil.parser.parse(due_attr) if due_attr else None
        except (ValueError, OverflowError):
            due_date = None

        assignments.append(GradescopeAssignment(
            assignment_id=assignment_id,
            name=header.get_text(" ", strip=True),
            due_date=due_date,
            status_text=status_text,
            # A link to your submission means it's in, whatever the status says
            handed_in=bool(submitted_link) or is_handed_in(status_text),
            max_points=float(score.group(1)) if score else None,
        ))
    return assignments

SEASON_ORDER = {"spring": 0, "summer": 1, "fall": 2}

# CMU now opens Gradescope through Turnitin's proxy (Turnitin owns Gradescope),
# attached to each assignment rather than as a "Gradescope" tab in the sidebar.
GRADESCOPE_TOOL_URLS = ("gradescope.com", "turnitin.com/launch/gs-proxy")


@dataclass
class GradescopeCourse:
    course_id: str
    name: str        # short name, e.g. "15150"
    full_name: str   # e.g. "Principles of Functional Programming"
    semester: str    # "Fall"
    year: str        # "2026"


def parse_account_page(soup):
    """Every course on the Gradescope account page, with its term.

    gradescopeapi's parser expects an older page layout and now returns no
    courses at all. The page lists each term (".courseList--term", e.g.
    "Fall 2026") followed by its course tiles (a.courseBox -> /courses/<id>).
    """
    courses = []
    for term in soup.select(".courseList--term"):
        semester, _, year = term.get_text(" ", strip=True).partition(" ")
        tiles = term.find_next_sibling(class_="courseList--coursesForTerm")
        for box in tiles.select("a.courseBox[href]") if tiles else []:
            match = re.search(r"/courses/(\d+)", box["href"])
            if not match:
                continue
            short = box.select_one(".courseBox--shortname")
            full = box.select_one(".courseBox--name")
            courses.append(GradescopeCourse(
                course_id=match.group(1),
                name=short.get_text(" ", strip=True) if short else "",
                full_name=full.get_text(" ", strip=True) if full else "",
                semester=semester,
                year=year.strip(),
            ))
    return courses


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
    """A one-time Canvas link that logs in to Gradescope.

    Tries a Gradescope tab in a course sidebar first, then any assignment that
    opens Gradescope (directly or through Turnitin's proxy, which is how CMU
    courses link it now)."""
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

    for course in canvas_courses:
        r = requests.get(
            f"{CANVAS_BASE_URL}/api/v1/courses/{course['id']}/assignments",
            headers=headers,
            params={"per_page": 100},
        )
        if r.status_code != 200:
            continue
        for assignment in r.json():
            tool_url = ((assignment.get("external_tool_tag_attributes") or {}).get("url") or "").lower()
            if not any(u in tool_url for u in GRADESCOPE_TOOL_URLS):
                continue
            launch = requests.get(
                f"{CANVAS_BASE_URL}/api/v1/courses/{course['id']}/external_tools/sessionless_launch",
                headers=headers,
                params={"launch_type": "assessment", "assignment_id": assignment["id"]},
            )
            if launch.status_code == 200 and launch.json().get("url"):
                print(f"Logging in to Gradescope through {course.get('name')}: {assignment.get('name')}")
                return launch.json()["url"]
    return None


def get_gradescope_session(launch_url):
    """Open the LTI launch in invisible Chrome and copy the login cookies out."""
    driver = new_chrome()
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
        print("[!] No Canvas course links to Gradescope; skipping Gradescope")
        return []

    session = get_gradescope_session(launch_url)

    account = session.get(f"{GRADESCOPE_URL}/account")
    account.raise_for_status()
    courses = parse_account_page(BeautifulSoup(account.text, "html.parser"))
    if not courses:
        # Loud on purpose: a silent "0 assignments" is what hid this last time
        print("[!] Logged in to Gradescope but found no courses on the account page. "
              "Gradescope may have changed its layout; see parse_account_page.")
        return []

    latest = max(term_rank(c.semester, c.year) for c in courses)
    current = [c for c in courses if term_rank(c.semester, c.year) == latest]
    print(f"Found {len(current)} Gradescope courses this semester")

    results = []
    for course in current:
        page = session.get(f"{GRADESCOPE_URL}/courses/{course.course_id}")
        if page.status_code != 200:
            print(f"Skipping Gradescope course {course.name}: HTTP {page.status_code}")
            continue
        assignments = parse_course_page(BeautifulSoup(page.text, "html.parser"))
        course_name = course_name_for(course, canvas_courses)
        print(f"{course_name}: {len(assignments)} Gradescope assignments")
        results.extend((course_name, a) for a in assignments)
    return results


def send_gradescope_to_supabase(user_id, CANVAS_TOKEN):
    """Saves this semester's Gradescope assignments.

    Returns the handed-in ones that weren't saved because they're over a month
    old, so the duplicate check can still clear their Canvas copies (Canvas
    never sees a Gradescope submission, so that copy would sit in Overdue).
    """
    assignments = get_gradescope_assignments(CANVAS_TOKEN)

    existing = (
        supabase.table("assignments_duplicate")
        .select("assignment_id, status")
        .eq("user_id", user_id)
        .eq("platform", "Gradescope")
        .execute()
    )
    saved = {row["assignment_id"]: bool(row.get("status")) for row in (existing.data or [])}

    records = []
    newly_submitted = set()
    for course_name, a in assignments:
        if not a.assignment_id:
            continue
        assignment_id = f"{user_id} gradescope {a.assignment_id}"
        if not a.due_date:
            # Gradescope drops the dates once an assignment closes. If it was
            # saved earlier as not handed in and has been submitted since (e.g.
            # right before the deadline), mark it done instead of leaving it
            # stuck as overdue.
            if a.handed_in and saved.get(assignment_id) is False:
                newly_submitted.add(assignment_id)
            continue
        records.append({
            "course_name": course_name,
            "assignment_id": assignment_id,
            "assignment_name": a.name,
            "due_date": a.due_date.isoformat(),
            "points_possible": a.max_points,
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            # Only used to decide what's worth saving; see save_assignments
            "status": a.handed_in or saved.get(assignment_id, False),
            "handed_in": a.handed_in,
            "platform": "Gradescope",
        })

    # Skip finished work over a month old and anything from long ago
    kept = [r for r in records if worth_saving(r["due_date"], r["status"])]
    done_unsaved = [r for r in records if r["handed_in"] and r not in kept]

    save_assignments(kept)
    if newly_submitted:
        supabase.table("assignments_duplicate").update({"status": True}).in_(
            "assignment_id", list(newly_submitted)
        ).execute()

    # The old scraper also saved undated rows (in-class quizzes/exams), which the
    # inbox showed as due today
    supabase.table("assignments_duplicate").delete().eq("user_id", user_id).eq(
        "platform", "Gradescope"
    ).is_("due_date", "null").execute()
    print(f"Saved {len(kept)} Gradescope assignments ({len(newly_submitted)} closed ones marked submitted, "
          f"{len(done_unsaved)} older submitted ones used only to clear Canvas copies)")
    return done_unsaved
