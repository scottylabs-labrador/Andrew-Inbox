import os
import sys
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from data_scrape_for_piazza import (
    CANVAS_BASE_URL,
    get_paginated,
)

CANVAS_API_KEY = ""

HEADERS = {
    "Authorization": f"Bearer {CANVAS_API_KEY}"
}


# Pick a course that has Piazza
course_id = 54279

# Find Piazza
tools = get_paginated(
    f"{CANVAS_BASE_URL}/api/v1/courses/"
    f"{course_id}/external_tools/visible_course_nav_tools",
    CANVAS_API_KEY
)

piazza = next(
    tool for tool in tools
    if "piazza" in tool.get("name", "").lower()
)

print("Piazza tool:", piazza["url"])


# Ask Canvas for a fresh launch URL
response = __import__("requests").get(
    f"{CANVAS_BASE_URL}/api/v1/courses/"
    f"{course_id}/external_tools/sessionless_launch",
    headers=HEADERS,
    params={
        "url": piazza["url"]
    }
)

response.raise_for_status()

launch_url = response.json()["url"]

print("\nLaunch URL obtained.")


# Open it in Chrome
options = Options()
options.add_argument("--start-maximized")
from piazza_api.rpc import PiazzaRPC
from piazza_api import Piazza

driver = webdriver.Chrome(options=options)

try:
    driver.get(launch_url)

    print("Piazza page:", driver.current_url)

    # Get Piazza cookies
    piazza_cookies = {
        c["name"]: c["value"]
        for c in driver.get_cookies()
        if "piazza.com" in c["domain"]
    }

    print("Piazza cookies:", list(piazza_cookies))

    # Authenticate API client
    rpc = PiazzaRPC()
    rpc.set_cookies(piazza_cookies)

    print("RPC created")

    # Test authentication
    # print("Getting profile...")
    # print(rpc.get_user_profile())

    # Get classes
    print("Getting classes...")
    p = Piazza(piazza_rpc=rpc)
    classes = p.get_user_classes()

    # print("Classes:", classes)

    # # First class
    # course = classes[0]
    # print("Using:", course)

    # network = p.network(course["nid"])

    # print("Getting posts...")
    # posts = list(network.iter_all_posts(sleep=1))

    # print(f"Got {len(posts)} posts")

    # for post in posts:
    #     print("=" * 60)
    #     print("TITLE:", post.get("subject"))
    #     print("POST:")
    #     print(post)

    # input("Press Enter to close...")

    # feed = rpc.get_my_feed(nid="mt4qde1vl4y3a2")
    # print(feed)



    network = p.network("mt4qde1vl4y3a2")
    posts = list(network.iter_all_posts(sleep=0.5, limit=10))
    i = 0
    for post in posts:
        i+=1
        print("=" * 60)
        print("TITLE:", post.get("subject"))
        print("POST:")
        print(post)
        if i == 10:
            break


    
    print("Getting posts... ")





finally:
    driver.quit()
