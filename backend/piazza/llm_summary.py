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
                "content": "Summarize this message aiming for conciseness. Include all important details for a student in this class. No need to explain all the details. The student has the link if they want to see the full post anyway. Do not use LaTex in your summary. Here is the message title and description: " + description
            }
        ],
        # Without a cap, OpenRouter reserves the model's full output limit (65k
        # tokens) for every summary and refuses the request once the key's
        # credit is below that. A summary needs a few hundred tokens; the rest
        # leaves room for the model's (kept low) reasoning.
        max_tokens=2000,
        extra_body={"reasoning": {"effort": "low"}},
    )

    summary = (response.choices[0].message.content or "").strip()
    if not summary:
        # Ran out of tokens before answering; the caller shows the post itself
        raise ValueError("empty summary")
    return summary