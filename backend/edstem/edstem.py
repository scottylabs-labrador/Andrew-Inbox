# Reads recent posts from Ed Discussion (edstem.org) with the user's own API
# token. Users make one at https://edstem.org/us/settings/api-tokens.
#
# Ed has no official API docs; endpoints follow the community client
# https://github.com/smartspot2/edapi (docs/api_docs.md):
#   GET /user                      -> {"courses": [{"course": {...}, "role": {...}}]}
#   GET /courses/<id>/threads      -> {"threads": [...]}, newest first

from datetime import datetime, timedelta, timezone

import requests

ED_API_URL = "https://us.edstem.org/api"
ED_WEB_URL = "https://edstem.org/us"

LOOKBACK = timedelta(days=7)  # same window as Piazza
THREADS_PER_PAGE = 100        # Ed's maximum
MAX_PAGES = 5                 # stop early in very busy courses


class InvalidEdTokenError(Exception):
    """Ed rejected the token (wrong, expired, or deleted)."""


def _error_code(response):
    try:
        return response.json().get("code")
    except ValueError:
        return None


def _get(session, path, **params):
    r = session.get(f"{ED_API_URL}{path}", params=params, timeout=20)
    # Ed answers a bad token with 400 {"code": "bad_token"} (401 if missing)
    if r.status_code == 401 or (r.status_code == 400 and _error_code(r) == "bad_token"):
        raise InvalidEdTokenError()
    r.raise_for_status()
    return r.json()


def parse_date(date_str):
    return datetime.fromisoformat(date_str.replace("Z", "+00:00"))


def get_active_courses(session):
    """This semester's courses; past ones are "archived"."""
    user = _get(session, "/user")
    return [c["course"] for c in user.get("courses", []) if c["course"].get("status") == "active"]


def get_recent_threads(session, course, cutoff):
    """Posts in one course created after `cutoff`."""
    found = []
    for page in range(MAX_PAGES):
        threads = _get(
            session,
            f"/courses/{course['id']}/threads",
            limit=THREADS_PER_PAGE,
            offset=page * THREADS_PER_PAGE,
            sort="new",
        ).get("threads", [])

        found.extend(t for t in threads if parse_date(t["created_at"]) >= cutoff)

        # Sorted newest first: once a page reaches past the cutoff, we're done
        if len(threads) < THREADS_PER_PAGE or parse_date(threads[-1]["created_at"]) < cutoff:
            break
    return found


def get_ed_posts(ed_token):
    """Yields (course, thread) for every post from the last week in the user's active Ed courses."""
    cutoff = datetime.now(timezone.utc) - LOOKBACK
    with requests.Session() as session:
        session.headers["Authorization"] = f"Bearer {ed_token}"
        for course in get_active_courses(session):
            for thread in get_recent_threads(session, course, cutoff):
                yield course, thread


def thread_url(thread):
    return f"{ED_WEB_URL}/courses/{thread['course_id']}/discussion/{thread['id']}"
