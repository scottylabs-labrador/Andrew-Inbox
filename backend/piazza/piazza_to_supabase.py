from .piazza import get_all_posts

# IMPORTS
# ===============================
import requests
from datetime import datetime, timezone
from supabase import create_client, Client
import json
import os
from dotenv import load_dotenv

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[2]))

from config import supabase


# ===============================
# SUPABASE CONFIG
# ===============================

def send_piazza_to_supabase(user_id, CANVAS_API_KEY):
    # Posts saved by an earlier fetch keep their summary and, importantly, their
    # read/unread state. Re-saving them with "is_read": False marked everything
    # unread again on every fetch.
    existing = (
        supabase.table("announcements")
        .select("link")
        .eq("user_id", user_id)
        .eq("platform", "piazza")
        .execute()
    )
    known_urls = {row["link"] for row in (existing.data or [])}

    piazza_posts = get_all_posts(CANVAS_API_KEY, known_urls)

    for post in piazza_posts:
        # No "is_read": new posts start unread (the column default)
        announcement = {
            "user_id": user_id,
            "course": post["course"],
            "title": post["title"],
            "description": post["text"],
            "link": post["url"],
            "date": datetime.fromisoformat(post["date"]).astimezone(timezone.utc).isoformat(),
            "platform": "piazza",
            "announcement_id": f"{user_id} piazza {post["url"]}",
        }
        try:
            supabase.table("announcements").upsert(
                announcement,
                on_conflict="announcement_id"
            ).execute()
        except Exception as e:
            print("Supabase insert exception:", e)
    print(f"Saved {len(piazza_posts)} new Piazza posts ({len(known_urls)} already saved)")
