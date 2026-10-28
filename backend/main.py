
# On user login or sync
# 1. get user id
# 2. retrieve canvas token from user id and verify its a valid user_id
# 3. call scrape piazza, gradescope and canvas with canvas token
# 4. upload all of them to supabase

from fastapi import FastAPI, BackgroundTasks, HTTPException, Header
from pydantic import BaseModel
from canvas import send_canvas_to_supabase
from piazza.piazza_to_supabase import send_piazza_to_supabase
from gradescope import send_gradescope_to_supabase
from dedupe import remove_cross_platform_duplicates
import os   
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

import sys
import threading
from contextlib import asynccontextmanager
from pathlib import Path

from supabase import create_client, Client

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import supabase

READY_MESSAGE = """
==============================================================
  DONE! The backend is running and the extension works now.
  Open Andrew Inbox in Chrome and press Scrape.
  Keep this window open while you use it (close it to stop).
==============================================================
"""


@asynccontextmanager
async def lifespan(app):
    # Uvicorn prints its own "running on" lines right after startup; wait a
    # moment so this message is the last thing in the window.
    threading.Timer(1.0, lambda: print(READY_MESSAGE, flush=True)).start()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows your frontend to talk to the backend
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_entry_by_pk(user_id: any):
    try:
        response = (
            supabase.from_("profiles")
            .select("canvas_token")    # only select the column we need
            .eq("id", user_id)
            .execute()
        )

        # if response.error:
        #     print(f"Supabase error: {response.error}")
        #     return None

        if response.data:
            # Use .get() in case 'canvas_api_key' doesn't exist
            return response.data[0].get("canvas_token")
        else:
            print("No user found with that user_id")
            return None

    except Exception as e:
        print(f"An exception occurred: {e}")
        return None


def sync_supabase(user_id):
    CANVAS_API_KEY = get_entry_by_pk(user_id)
    if not CANVAS_API_KEY:
        print(f"Error: No API key found for {user_id}")
        return
    send_canvas_to_supabase(user_id, CANVAS_API_KEY)

    send_piazza_to_supabase(user_id, CANVAS_API_KEY)
    send_gradescope_to_supabase(user_id, CANVAS_API_KEY)
    remove_cross_platform_duplicates(user_id)
    print("FINISHED SYNC")


# Users sign in with Supabase Auth in the extension, which sends its access token
# here. Asking Supabase who the token belongs to means nobody can trigger a
# sync for someone else's account.
def get_signed_in_user_id(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Please sign in again.")
    try:
        response = supabase.auth.get_user(authorization.removeprefix("Bearer "))
    except Exception:
        response = None
    if not response or not response.user:
        raise HTTPException(status_code=401, detail="Please sign in again.")
    return response.user.id


@app.post("/sync")
def trigger_sync(authorization: str | None = Header(default=None)):
    user_id = get_signed_in_user_id(authorization)
    if not get_entry_by_pk(user_id):
        raise HTTPException(status_code=400, detail="Add your Canvas token first.")
    try:
        sync_supabase(user_id)
        return {
            "status": "success",
            "message": f"Sync completed for {user_id}."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
