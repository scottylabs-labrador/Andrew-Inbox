from .data_scrape_for_piazza import CANVAS_BASE_URL, get_paginated, print_header
from .llm_summary import summarize
import requests, time, re, html
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from piazza_api import Piazza
from piazza_api.rpc import PiazzaRPC
from piazza_api.exceptions import RequestError

session = requests.Session()
canvas_url = f"{CANVAS_BASE_URL}/api/v1/courses"

PIAZZA_DELAY = 0.25     # seconds between Piazza API calls (avoid rate limiting)
PIAZZA_RETRIES = 3
FEED_LIMIT = 150
LOOKBACK = timedelta(days=7)
SUMMARY_WORKERS = 8

# =========================
# HELPERS
# =========================

def get_paginated_session(url, HEADERS):
    results = []
    while url:
        r = session.get(url, headers=HEADERS)
        r.raise_for_status()
        results.extend(r.json())
        url = r.links.get("next", {}).get("url")
    return results


def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except ValueError:
        return None


def html_to_text(content):
    text = re.sub(r"<br\s*/?>|</p>|</li>", "\n", content or "", flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return html.unescape(text).strip()


SEASON_ORDER = {"spring": 0, "summer": 1, "fall": 2}

def term_rank(term):
    """Sortable key for a Piazza term like "Fall 2026"."""
    term = (term or "").lower()
    year = re.search(r"\d{4}", term)
    season = next((rank for name, rank in SEASON_ORDER.items() if name in term), -1)
    return (int(year.group()) if year else 0, season)


def latest_term_classes(classes):
    """Keep only the classes in the most recent term the user is enrolled in."""
    if not classes:
        return []
    latest = max(term_rank(c.get("term")) for c in classes)
    return [c for c in classes if term_rank(c.get("term")) == latest]


def safe_summarize(text):
    try:
        return summarize(text)
    except Exception as e:
        print("Summary failed:", e)
        return text[:500]


_last_call = 0.0

def piazza_call(fn, *args, **kwargs):
    """Throttle Piazza API calls and back off on errors (e.g. rate limits)."""
    global _last_call
    for attempt in range(PIAZZA_RETRIES):
        wait = PIAZZA_DELAY - (time.monotonic() - _last_call)
        if wait > 0:
            time.sleep(wait)
        _last_call = time.monotonic()
        try:
            return fn(*args, **kwargs)
        except RequestError as e:
            if attempt == PIAZZA_RETRIES - 1:
                raise
            print(f"Piazza error, retrying in {2 ** attempt}s:", str(e).splitlines()[0])
            time.sleep(2 ** attempt)


# =========================
# PIAZZA LOGIN (via Canvas LTI)
# =========================

def find_piazza_launch_url(CANVAS_API_KEY):
    """Look through Canvas courses until one has Piazza in the sidebar."""
    HEADERS = {
        "Authorization": f"Bearer {CANVAS_API_KEY}"
    }
    courses = get_paginated_session(canvas_url, HEADERS)

    for course in courses:
        course_id = course["id"]

        try:
            ext_tools = get_paginated(
                f"{CANVAS_BASE_URL}/api/v1/courses/{course_id}/external_tools/visible_course_nav_tools", CANVAS_API_KEY
            )
        except requests.exceptions.HTTPError:
            continue

        for tool in ext_tools:
            if "piazza" not in tool.get("name", "").lower():
                continue

            print(f"Piazza found in {course.get('name', 'Unnamed Course')}")

            r = session.get(
                f"{CANVAS_BASE_URL}/api/v1/courses/{course_id}/external_tools/sessionless_launch",
                headers=HEADERS,
                params={"url": tool.get("url", "")}
            )
            if r.status_code != 200:
                continue

            launch_url = r.json().get("url")
            if launch_url:
                return launch_url

    return None


def get_piazza_cookies(launch_url):
    """Open the LTI launch in Chrome and grab the Piazza session cookies."""
    options = Options()
    options.add_argument("--headless=new")
    driver = webdriver.Chrome(options=options)

    try:
        driver.get(launch_url)

        def piazza_cookies(d):
            cookies = {
                c["name"]: c["value"]
                for c in d.get_cookies()
                if "piazza.com" in c["domain"]
            }
            return cookies if "session_id" in cookies else False

        return WebDriverWait(driver, 20).until(piazza_cookies)
    finally:
        driver.quit()


# =========================
# PIAZZA API
# =========================

def get_recent_post_ids(rpc, nid, cutoff):
    feed = piazza_call(rpc.get_my_feed, limit=FEED_LIMIT, offset=0, nid=nid)
    post_ids = []
    for item in feed.get("feed", []):
        updated = parse_date(item.get("updated") or item.get("modified"))
        if updated and updated >= cutoff:
            post_ids.append(item["id"])
    return post_ids


def get_all_posts(CANVAS_API_KEY):
    launch_url = find_piazza_launch_url(CANVAS_API_KEY)
    if not launch_url:
        print("No Piazza course found")
        return []

    rpc = PiazzaRPC()
    rpc.set_cookies(get_piazza_cookies(launch_url))
    p = Piazza(piazza_rpc=rpc)

    classes = piazza_call(p.get_user_classes)
    classes = latest_term_classes(classes)
    print(f"Found {len(classes)} Piazza classes this semester")

    cutoff = datetime.now(timezone.utc) - LOOKBACK
    all_posts = []

    # Piazza calls stay sequential + throttled; LLM summaries run in parallel meanwhile
    with ThreadPoolExecutor(max_workers=SUMMARY_WORKERS) as pool:
        for c in classes:
            nid = c["nid"]
            course_name = c.get("num") or c.get("name", "Unnamed Course")

            try:
                post_ids = get_recent_post_ids(rpc, nid, cutoff)
            except RequestError as e:
                print(f"Skipping class {course_name}:", str(e).splitlines()[0])
                continue

            print(f"{course_name}: {len(post_ids)} posts this week")

            for post_id in post_ids:
                try:
                    post = piazza_call(rpc.content_get, post_id, nid=nid)
                except RequestError as e:
                    print(f"Skipping post {post_id}:", str(e).splitlines()[0])
                    continue

                latest = (post.get("history") or [{}])[0]
                title = html.unescape(latest.get("subject", ""))
                content = html_to_text(latest.get("content", ""))

                all_posts.append({
                    "course": course_name,
                    "title": title,
                    "text": pool.submit(safe_summarize, title + " : " + content),
                    "date": post.get("created") or latest.get("created"),
                    "url": f"https://piazza.com/class/{nid}/post/{post_id}"
                })

        for post in all_posts:
            post["text"] = post["text"].result()

    return all_posts


# =========================
# RUN DIRECTLY (SAFE)
# =========================

if __name__ == "__main__":
    import os
    print_header("Piazza Posts")
    posts = get_all_posts(os.getenv("CANVAS_API_KEY"))
    for post in posts:
        print("=" * 60)
        print(post["course"], "|", post["title"], "|", post["date"])
        print(post["text"])
    print("\nTOTAL POSTS:", len(posts))
