
# On user login or sync
# 1. get user id
# 2. retrieve canvas token from user id and verify its a valid user_id
# 3. call scrape piazza, gradescope and canvas with canvas token
# 4. upload all of them to supabase

from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from canvas import send_canvas_to_supabase
from piazza.piazza_to_supabase import send_piazza_to_supabase
from gradescope import send_gradescope_to_supabase
import os   
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

import sys
from pathlib import Path

from supabase import create_client, Client

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import supabase

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows your frontend to talk to the backend
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_entry_by_pk(user_id: any):
    try:
        response = (
            supabase.from_("user")      # replace "users" with your actual table name
            .select("canvas_token")    # only select the column we need
            .eq("user_id", user_id)      # filter by user_id
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
    print("FINISHED SYNC")

class UserRequest(BaseModel):
    user_id: str

@app.post("/sync")
async def trigger_sync(request: UserRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(sync_supabase, request.user_id)
    
    return {
        "status": "accepted",
        "message": f"Sync started for {request.user_id}. Check Supabase shortly."
    }
