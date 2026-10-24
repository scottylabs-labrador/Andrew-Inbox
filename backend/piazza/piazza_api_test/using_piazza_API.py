import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import requests

from data_scrape_for_piazza import (
    CANVAS_BASE_URL,
    get_paginated,
)

CANVAS_API_KEY = ""

headers = {
    "Authorization": f"Bearer {CANVAS_API_KEY}"
}

r = requests.get(
    f"{CANVAS_BASE_URL}/api/v1/users/self",
    headers=headers,
)

# -------------------------
# Get your Canvas courses
# -------------------------

courses = get_paginated(
    f"{CANVAS_BASE_URL}/api/v1/courses",
    CANVAS_API_KEY
)

print(f"Found {len(courses)} courses")


# -------------------------
# Find Piazza + LTI launch
# -------------------------

for course in courses:

    course_id = course["id"]
    course_name = course.get("name", "Unnamed Course")

    print(f"\n{'=' * 60}")
    print(course_name)
    print("Course ID:", course_id)

    try:
        tools = get_paginated(
            f"{CANVAS_BASE_URL}/api/v1/courses/"
            f"{course_id}/external_tools/visible_course_nav_tools",
            CANVAS_API_KEY
        )
    except requests.HTTPError as e:
        print("Could not retrieve external tools:", e)
        continue

    for tool in tools:

        name = tool.get("name", "")

        if "piazza" not in name.lower():
            continue

        print("\nPiazza found!")
        print("Tool name:", name)
        print("Tool URL:", tool.get("url"))

        # -------------------------
        # Ask Canvas for LTI launch
        # -------------------------

        launch_endpoint = (
            f"{CANVAS_BASE_URL}/api/v1/courses/"
            f"{course_id}/external_tools/sessionless_launch"
        )

        response = requests.get(
            launch_endpoint,
            headers=headers,
            params={
                "url": tool.get("url")
            }
        )

        print("Launch status:", response.status_code)

        response.raise_for_status()

        launch_data = response.json()

        print("\nCanvas launch response:")
        print(launch_data)

        piazza_launch_url = launch_data.get("url")

        print("\nPiazza launch URL:")
        print(piazza_launch_url)
