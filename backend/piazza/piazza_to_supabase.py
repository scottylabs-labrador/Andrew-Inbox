from piazza import get_all_posts

# IMPORTS
# ===============================
import requests
from datetime import datetime, timezone
from supabase import create_client, Client
import json
import os
from dotenv import load_dotenv

# ===============================
# SUPABASE CONFIG
# ===============================

SUPABASE_URL = ""
SUPABASE_KEY = ""

# supabase_url = os.getenv(SUPABASE_URL)
# supabase_key = os.getenv(SUPABASE_KEY)

supabase_url = SUPABASE_URL
supabase_key = SUPABASE_KEY

supabase: Client = create_client(supabase_url, supabase_key)

piazza_posts = get_all_posts()

for post in piazza_posts:
    announcement = {
        "user_id": "pnimmaga",
        "course": post["course"],
        "title": post["title"],
        "description": post["text"],
        "link": post["url"],
        "date": datetime.fromisoformat(post["date"]).astimezone(timezone.utc).isoformat(),
        "platform": "piazza",
        "is_read": False        
    }
    try:
        response = supabase.table("annoucements").upsert(
            announcement,
            on_conflict="id"
        ).execute()    
    except Exception as e:
        print("Supabase insert exception:", e)