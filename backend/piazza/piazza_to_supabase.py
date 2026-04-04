from .piazza import get_all_posts

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
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def send_piazza_to_supabase(user_id, CANVAS_API_KEY):
    supabase: Client = create_client(supabase_url, supabase_key)
    piazza_posts = get_all_posts(CANVAS_API_KEY)

    for post in piazza_posts:
        announcement = {
            "user_id": user_id,
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

