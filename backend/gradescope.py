# REQUIRES CANVAS DATA SCRAPE TO BE RUN FIRST TO GET COURSES (change line 1 to match file name))
import requests, csv
from time import sleep
from  datetime import datetime, timezone
from bs4 import BeautifulSoup
from selenium import webdriver
import gradescopeapi.classes._helpers._assignment_helpers as gscope_helpers
# =========================
# 4. GRADESCOPE LOGIN (IF APPLICABLE)
# =========================

# def write_csv_headers(csvfile, writer):
#     if csvfile.tell() == 0:  # Only write headers if file is empty
#         writer.writeheader()

# def write_assignments_to_csv(gradescope_data):
#     assignment_dict = [dict((vars(Assignment).items())) for Assignment in gradescope_data]
#     for a in assignment_dict:
#         a["course_name"] = course_name
#         a["course_code"] = course.get("course_code", "---")
#         a["course_id"] = course_id
#     fields = assignment_dict[0].keys()
#     writer = csv.DictWriter(csvfile, fieldnames=fields)
#     write_csv_headers(csvfile, writer)
#     writer.writerows(assignment_dict)

# with open('gradescope_data.csv', 'w', newline='') as csvfile:
def send_gradescope_to_supabase(user_id, CANVAS_TOKEN):
    def get_paginated(url, HEADERS):
        results = []
        while url:
            r = requests.get(url, headers=HEADERS)
            r.raise_for_status()
            results.extend(r.json())
            url = r.links.get("next", {}).get("url")
        return results

    def get_paginated_session(session, url, HEADERS):
        sleep(1)  
        results = []
        while url:
            r = session.get(url, headers=HEADERS)
            r.raise_for_status()
            results.extend(r.json())
            url = r.links.get("next", {}).get("url")
        return results

    def get_active_classes(courses):
        # Get current time in UTC to match Canvas format
        curr_date = datetime.now(timezone.utc)
        active_courses = []
        for course in courses:
            term = course.get('term')
            if not term:
                continue
                
            end_at_str = term.get('end_at')       
            if end_at_str is None:
                active_courses.append(course)
                continue
            
            # Convert Canvas string to datetime object
            # Canvas uses 'Z' for UTC; replace with '+00:00' for older Python versions if needed
            end_at = datetime.fromisoformat(end_at_str.replace('Z', '+00:00'))        
            if end_at > curr_date:
                active_courses.append(course)
        return active_courses

    def get_class_ext_tools(course_id, CANVAS_BASE_URL):
        # Access course external tools
        ext_tools = []
        try:
            ext_tools = get_paginated(
                f"{CANVAS_BASE_URL}/api/v1/courses/{course_id}/external_tools/visible_course_nav_tools")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                # print(f"\n{course_name}")
                # print("-" * len(course_name))
                # print(f"External tools access blocked for {course_name}")
                ext_tools = []  # Skip to the next course
            else:
                raise  # Re-raise other HTTP errors
        return ext_tools

    def get_gscope_url(course_id, tool, CANVAS_BASE_URL, HEADERS, session):
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

    def load_gscope_cookies(driver, session):
        for cookie in session.cookies:
            try:
                driver.add_cookie({
                    'name': cookie.name,
                    'value': cookie.value,
                })
            except:
                pass

    def gscope_login(gscope_url, driver, session, HEADERS):
        # Pre-load cookies from session before navigating
        driver.get("https://www.gradescope.com")  # Navigate to domain first
        load_gscope_cookies(driver, session)  # Load cookies into Selenium session

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

    def write_assignments_to_database(user_id, gradescope_data):
        assignment_dict = [dict((vars(Assignment).items())) for Assignment in gradescope_data]
        for a in assignment_dict:
            a["course_name"] = course_name
            a["course_code"] = course.get("course_code", "---")
            a["course_id"] = course_id
            assignment_record = {
                "course_name": a["course_name"],
                "assignment_id": user_id + "Gradescope" + a["assignment_id"],
                "assignment_name": a["name"],
                "due_date": a["due_date"].isoformat() if a["due_date"] else None,
                "points_possible": a.get("max_grade"),
                "retrieved_at": datetime.now(timezone.utc).isoformat(),
                "user_id": user_id,
                "status": False,
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

    CANVAS_BASE_URL = "https://canvas.cmu.edu"
    session = requests.Session()
    canvas_url = f"{CANVAS_BASE_URL}/api/v1/courses?include[]=term"
    HEADERS = {
       "Authorization": f"Bearer {CANVAS_TOKEN}"
       }

    courses = get_paginated_session(session, canvas_url, HEADERS)
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
                gscope_url = get_gscope_url(course_id, tool, CANVAS_BASE_URL, HEADERS, session)
                if not gscope_url:
                    continue

                # Launch Gradescope URL to access grades/assignments
                r1 = session.get(gscope_url, headers=HEADERS)
                if r1.status_code == 200:
                    # Handle redirects and extract final URL after login
                    driver = webdriver.Chrome()  # Ensure chromedriver is in PATH
                
                    response, driver = gscope_login(gscope_url, driver, session, HEADERS)
                    soup = BeautifulSoup(response.text, 'html.parser')
                    gradescope_data = gscope_helpers.get_assignments_student_view(soup)
                    # print(gradescope_data)

                    if gradescope_data != []:
                        # write_assignments_to_csv(gradescope_data)
                        write_assignments_to_database(user_id,gradescope_data)
                    driver.quit()
                    
                    
                else:
                    print("Failed to access Gradescope URL.")

print("Gradescope data successfully retrieved.")