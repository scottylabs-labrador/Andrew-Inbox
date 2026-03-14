import requests
import json
import os
from dotenv import load_dotenv
from openai import OpenAI


load_dotenv(".env")


client = OpenAI(
    api_key=os.getenv("OPENROUTER_API"),
    base_url="https://openrouter.ai/api/v1",
)

def summarize(description):
    response = client.chat.completions.create(
        model = "openai/gpt-5.2",
        messages = [
            {
                "role": "user",
                "content": "Summarize this message. Include all important details for a student in this class. Here is the message: " + description
            }
        ]
    )

    return response.choices[0].message.content

response = summarize("My office hour from 3:30 to 4:30 will be delayed by 15min due to a personal schedule change. My office hour will run from 3:45 to 4:45 today. The change is only for today.")

print(response);