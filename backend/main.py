from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCredentials(BaseModel):
    user_id: str
    password_key: str

@app.post("/execute-script")
async def run_my_script(creds: UserCredentials):
    uid = creds.user_id
    pwd = creds.password_key
    
    print(f"!!! RECEIVED !!! ID: {uid} | PWD: {pwd}")
    
    # Logic for Supabase or script execution goes here
    return {"status": "success", "message": f"Authenticated {uid}"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)