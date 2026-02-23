# REQUIRES CANVAS DATA SCRAPE TO BE RUN FIRST TO GET COURSES (change line 1 to match file name))
from data_scrape import CANVAS_BASE_URL, HEADERS, get_paginated, print_header
import requests, time
from bs4 import BeautifulSoup
from selenium import webdriver
from gradescopeapi.classes._helpers._assignment_helpers import get_assignments_student_view

# =========================
# 4. GRADESCOPE LOGIN (IF APPLICABLE)
# =========================

print_header("External Tools (Gradescope)")

session = requests.Session()

canvas_url = f"{CANVAS_BASE_URL}/api/v1/courses"

def get_paginated_session(url):
    time.sleep(1)  
    results = []
    while url:
        r = session.get(url, headers=HEADERS)
        r.raise_for_status()
        results.extend(r.json())
        url = r.links.get("next", {}).get("url")
    return results

courses = get_paginated_session(canvas_url);

for course in courses:
    course_id = course["id"]
    course_name = course.get("name", "Unnamed Course")

    ext_tools = []
    # Access course external tools
    try:
        ext_tools = get_paginated(
            f"{CANVAS_BASE_URL}/api/v1/courses/{course_id}/external_tools/visible_course_nav_tools")
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 403:
            print(f"\n{course_name}")
            print("-" * len(course_name))
            print(f"External tools access blocked for {course_name}")
            continue  # Skip to the next course
        else:
            raise  # Re-raise other HTTP errors

    if not ext_tools:
        continue


    for tool in ext_tools:
        if "Gradescope LTI 1.3" in tool.get("name", ""):
            print(f"\n{course_name}")
            print("-" * len(course_name))
            print("Gradescope integration detected. Attempting login...")

            # Access sessionless launch URL for Gradescope
            launch_url = f"{CANVAS_BASE_URL}/api/v1/courses/{course_id}/external_tools/sessionless_launch?url={tool.get('url', '')}"
            gscope_url = "";
            r = session.get(launch_url, headers=HEADERS)
            if r.status_code == 200:
                print("Successfully accessed Gradescope sessionless launch URL.")
                gscope_url = r.json().get("url", "")
            else:
                print("Failed to access Gradescope sessionless launch URL.")

            # Launch Gradescope URL to access grades/assignments
            r1 = session.get(gscope_url, headers=HEADERS)
            if r1.status_code == 200:
                # Handle redirects and extract final URL after login
                driver = webdriver.Chrome()  # Ensure chromedriver is in PATH

                # Pre-load cookies from session before navigating
                driver.get("https://www.gradescope.com")  # Navigate to domain first
                for cookie in session.cookies:
                    try:
                        driver.add_cookie({
                            'name': cookie.name,
                            'value': cookie.value,
                        })
                    except:
                        pass

                driver.get(gscope_url)
                time.sleep(7)
                final_url = driver.current_url
                print(f"Final URL: {final_url}")

                # Grab cookies from response and use with requests
                for cookie in driver.get_cookies():
                    session.cookies.set(cookie['name'], cookie['value'])                
                
                response = session.get(final_url, headers=HEADERS)
                print(f"Status: {response.status_code}")
                soup = BeautifulSoup(response.text, 'html.parser')
                print(get_assignments_student_view(soup))

                driver.quit()
                
                
            else:
                print("Failed to access Gradescope URL.")

print_header("DATA EXTRACTION COMPLETE")
print("Gradescope data successfully retrieved.")


