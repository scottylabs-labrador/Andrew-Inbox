import requests
import json
import os
from dotenv import load_dotenv
from openai import OpenAI

def summarize(description):

    load_dotenv(".env")


    client = OpenAI(
        api_key=os.getenv("OPENROUTER_API"),
        base_url="https://openrouter.ai/api/v1",
    )

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

