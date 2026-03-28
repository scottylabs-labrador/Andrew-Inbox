
# On user login or sync
# 1. get user id
# 2. retrieve canvas token from user id and verify its a valid user_id
# 3. call scrape piazza, gradescope and canvas with canvas token
# 4. upload all of them to supabase
# 5. Call function to update UI

from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel

app = FastAPI()

def get_entry_by_pk(table_name: str, pk_column: str, pk_value: any):
    try:
        response = supabase.table(table_name).select("*").eq(pk_column, pk_value).execute()
        if response.data:
            return response.data[0]['canvas_token']
        else:
            return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

def sync_supabase(user_id):
    CANVAS_API_KEY = get_entry_by_pk("user", "user_id", user_id)
    if not canvas_api_key:
        print(f"Error: No API key found for {user_id}")
        return
    send_piazza_to_supabase(user_id, CANVAS_API_KEY)
    send_canvas_to_supabase(user_id, CANVAS_API_KEY)

class UserRequest(BaseModel):
    user_id: str

@app.post("/sync")
async def trigger_sync(request: UserRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(sync_supabase, request.user_id)
    
    return {
        "status": "accepted",
        "message": f"Sync started for {request.user_id}. Check Supabase shortly."
    }
