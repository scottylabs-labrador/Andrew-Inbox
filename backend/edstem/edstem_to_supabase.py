import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import timezone
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[2]))
from config import supabase
from courses import course_number
from piazza.llm_summary import summarize

from .edstem import parse_date, get_ed_posts, thread_url

PLATFORM = "ed"  # shown as "Ed" in the extension
SUMMARY_WORKERS = 8


def safe_summarize(text):
    try:
        return summarize(text)
    except Exception as e:
        print("Ed summary failed:", e)
        return text[:500]


def send_edstem_to_supabase(user_id, ed_token):
    # Only new posts get summarized and saved; existing rows (and
    # whether the user read them) are left alone.
    existing = (
        supabase.table("announcements")
        .select("announcement_id")
        .eq("user_id", user_id)
        .eq("platform", PLATFORM)
        .execute()
    )
    saved_ids = {row["announcement_id"] for row in existing.data or []}

    new = []
    for course, thread in get_ed_posts(ed_token):
        announcement_id = f"{user_id} ed {thread['id']}"
        if announcement_id not in saved_ids:
            new.append((announcement_id, course, thread))

    if not new:
        print("Ed: no new posts")
        return

    texts = [f"{t['title']} : {t.get('document') or ''}" for _, _, t in new]
    with ThreadPoolExecutor(max_workers=SUMMARY_WORKERS) as pool:
        summaries = list(pool.map(safe_summarize, texts))

    records = [
        {
            "announcement_id": announcement_id,
            "user_id": user_id,
            "course": course_number(course.get("code"), course.get("name")) or course.get("code"),
            "title": thread["title"],
            "description": summary,
            "link": thread_url(thread),
            "date": parse_date(thread["created_at"]).astimezone(timezone.utc).isoformat(),
            "platform": PLATFORM,
            "is_read": False,
        }
        for (announcement_id, course, thread), summary in zip(new, summaries)
    ]
    supabase.table("announcements").upsert(records, on_conflict="announcement_id").execute()
    print(f"Ed: saved {len(records)} posts")
