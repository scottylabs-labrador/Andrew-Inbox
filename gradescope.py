# REQUIRES CANVAS DATA SCRAPE TO BE RUN FIRST TO GET COURSES (change line 1 to match file name))
from data_scrape import CANVAS_BASE_URL, HEADERS, get_paginated, print_header, get_active_classes
import requests, csv
from time import sleep
from  datetime import datetime, timezone
from bs4 import BeautifulSoup
from selenium import webdriver
import gradescopeapi.classes._helpers._assignment_helpers as gscope_helpers
from supabase import create_client, Client
import os
from dotenv import load_dotenv
# ===============================
# SUPABASE CONFIG
# ===============================

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# =========================
# 4. GRADESCOPE LOGIN (IF APPLICABLE)
# =========================

print_header("External Tools (Gradescope)")

session = requests.Session()
canvas_url = f"{CANVAS_BASE_URL}/api/v1/courses?include[]=term"

def get_paginated_session(url):
    sleep(1)  
    results = []
    while url:
        r = session.get(url, headers=HEADERS)
        r.raise_for_status()
        results.extend(r.json())
        url = r.links.get("next", {}).get("url")
    return results

def get_class_ext_tools(course_id):
    # Access course external tools
    ext_tools = []
    try:
        ext_tools = get_paginated(
            f"{CANVAS_BASE_URL}/api/v1/courses/{course_id}/external_tools/visible_course_nav_tools")
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 403:
            print(f"\n{course_name}")
            print("-" * len(course_name))
            print(f"External tools access blocked for {course_name}")
            ext_tools = []  # Skip to the next course
        else:
            raise  # Re-raise other HTTP errors
    return ext_tools

def get_gscope_url(course_id, tool):
    # Access launch URL for Gradescope
    launch_url = f"{CANVAS_BASE_URL}/api/v1/courses/{course_id}/external_tools/sessionless_launch?url={tool.get('url', '')}"
    gscope_url = "";
    r = session.get(launch_url, headers=HEADERS)
    if r.status_code == 200:
        print("Successfully accessed Gradescope launch URL.")
        gscope_url = r.json().get("url", "")
    else:
        print("Failed to access Gradescope launch URL.")
    return gscope_url

def load_gscope_cookies(driver):
    for cookie in session.cookies:
        try:
            driver.add_cookie({
                'name': cookie.name,
                'value': cookie.value,
            })
        except:
            pass

def gscope_login(gscope_url, driver):
    # Pre-load cookies from session before navigating
    driver.get("https://www.gradescope.com")  # Navigate to domain first
    load_gscope_cookies(driver)  # Load cookies into Selenium session

    driver.get(gscope_url)
    sleep(5)
    final_url = driver.current_url
    print(f"Final URL: {final_url}")

    # Grab cookies from response and use with requests
    for cookie in driver.get_cookies():
        session.cookies.set(cookie['name'], cookie['value'])                
    
    response = session.get(final_url, headers=HEADERS)
    print(f"Status: {response.status_code}")
    return response, driver

def write_csv_headers(csvfile, writer):
    if csvfile.tell() == 0:  # Only write headers if file is empty
        writer.writeheader()

def write_assignments_to_csv(gradescope_data):
    assignment_dict = [dict((vars(Assignment).items())) for Assignment in gradescope_data]
    for a in assignment_dict:
        a["course_name"] = course_name
        a["course_code"] = course.get("course_code", "---")
        a["course_id"] = course_id
    fields = assignment_dict[0].keys()
    writer = csv.DictWriter(csvfile, fieldnames=fields)
    write_csv_headers(csvfile, writer)
    writer.writerows(assignment_dict)

def write_assignments_to_database(gradescope_data):
    assignment_dict = [dict((vars(Assignment).items())) for Assignment in gradescope_data]
    for a in assignment_dict:
        a["course_name"] = course_name
        a["course_code"] = course.get("course_code", "---")
        a["course_id"] = course_id
        assignment_record = {
            "course_name": a["course_name"],
            "assignment_id": a["assignment_id"],
            "assignment_name": a["name"],
            "due_date": a["due_date"].isoformat() if a["due_date"] else None,
            "points_possible": a.get("max_grade"),
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
            # "status": a["submissions_status"],
            "platform": "Gradescope"
        }
    # Insert into Supabase
        try:
            response = supabase.table("assignments").upsert(assignment_record,
                                                            on_conflict="assignment_id",
                                                            ignore_duplicates=True).execute()
            if not response.data:
                print("Supabase insert failed:", response)
        except Exception as e:
            print("Supabase insert exception:", e)

# with open('gradescope_data.csv', 'w', newline='') as csvfile:
def send_gradescope_to_supabase():
    courses = get_paginated_session(canvas_url);
    active_courses = get_active_classes(courses)
    
    for course in active_courses:
        course_id = course["id"]
        course_name = course.get("name", "Unnamed Course")

        ext_tools = get_class_ext_tools(course_id)
        if not ext_tools:
            continue

        for tool in ext_tools:
            if "Gradescope LTI 1.3" in tool.get("name", ""):
                print(f"\n{course_name}")
                print("-" * len(course_name))
                print("Gradescope integration detected. Attempting login...")

                # Access launch URL for Gradescope
                gscope_url = get_gscope_url(course_id, tool)
                if not gscope_url:
                    continue

                # Launch Gradescope URL to access grades/assignments
                r1 = session.get(gscope_url, headers=HEADERS)
                if r1.status_code == 200:
                    # Handle redirects and extract final URL after login
                    driver = webdriver.Chrome()  # Ensure chromedriver is in PATH
                
                    response, driver = gscope_login(gscope_url, driver)
                    soup = BeautifulSoup(response.text, 'html.parser')
                    gradescope_data = gscope_helpers.get_assignments_student_view(soup)
                    # print(gradescope_data)

                    if gradescope_data != []:
                        # write_assignments_to_csv(gradescope_data)
                        write_assignments_to_database(gradescope_data)
                    driver.quit()
                    
                    
                else:
                    print("Failed to access Gradescope URL.")

print_header("DATA EXTRACTION COMPLETE")
print("Gradescope data successfully retrieved.")


