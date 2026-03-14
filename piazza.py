# REQUIRES CANVAS DATA SCRAPE TO BE RUN FIRST TO GET COURSES (change line 1 to match file name))
from data_scrape import CANVAS_BASE_URL, HEADERS, get_paginated, print_header
import requests, time
from selenium import webdriver
from selenium.webdriver.common.by import By

# =========================
# 4. PIAZZA LOGIN (IF APPLICABLE)
# =========================

print_header("External Tools (Piazza)")

session = requests.Session()

canvas_url = f"{CANVAS_BASE_URL}/api/v1/courses"


def get_piazza_posts(driver):
    
    posts_data = []

    posts = driver.find_elements(By.CSS_SELECTOR, "li.feed_item")
    course_name = driver.find_element(By.CSS_SELECTOR, "#topbar_current_class_number").text

    for post in posts:
        try:
            title = post.find_element(By.CSS_SELECTOR, ".title_text").text
            snippet = post.find_element(By.CSS_SELECTOR, ".snippet").text

            id_wrapper = post.find_element(By.CSS_SELECTOR, ".feed-item-wrapper").get_attribute("id")
            post_id = id_wrapper.replace("_wrapper", "")
            base_url = driver.current_url.split("#")[0]
            post_url = f"{base_url}/post/{post_id}"

            # post.click();
            # WebDriverWait(driver, 10).until(lambda d: d.current_url != old_url)
            # link = driver.current_url
            # driver.back()

            posts_data.append({"course":course_name,"title":title,"snippet":snippet,"post_url":post_url})
        except:
            continue
    
    return posts_data

def get_paginated_session(url):
    time.sleep(1)  
    results = []
    while url:
        r = session.get(url, headers=HEADERS)
        r.raise_for_status()
        results.extend(r.json())
        url = r.links.get("next", {}).get("url")
    return results

courses = get_paginated_session(canvas_url)

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
        
        if "Piazza" in tool.get("name", ""):
            print(f"\n{course_name}")
            print("-" * len(course_name))
            print("Piazza integration detected. Attempting login...")

            # Access sessionless launch URL for Piazza
            launch_url = f"{CANVAS_BASE_URL}/api/v1/courses/{course_id}/external_tools/sessionless_launch?url={tool.get('url', '')}"
            piazza_url = ""
            r = session.get(launch_url, headers=HEADERS)
            if r.status_code == 200:
                print("Successfully accessed Piazza sessionless launch URL.")
                piazza_url = r.json().get("url", "")
            else:
                print("Failed to access Piazza sessionless launch URL.")

            # Launch Piazza URL to access grades/assignments
            r1 = session.get(piazza_url, headers=HEADERS)
            if r1.status_code == 200:
                # Handle redirects and extract final URL after login
                driver = webdriver.Chrome()  # Ensure chromedriver is in PATH

                # Pre-load cookies from session before navigating
                driver.get("https://www.piazza.com")  # Navigate to domain first
                for cookie in session.cookies:
                    try:
                        driver.add_cookie({
                            'name': cookie.name,
                            'value': cookie.value,
                        })
                    except:
                        pass

                driver.get(piazza_url)
                time.sleep(7)
                final_url = driver.current_url
                print(f"Final URL: {final_url}")

                # Grab cookies from response and use with requests
                for cookie in driver.get_cookies():
                    session.cookies.set(cookie['name'], cookie['value'])                

                posts = get_piazza_posts(driver)

                for p in posts:
                    print(p)

                driver.quit()
                
            else:
                print("Failed to access Piazza URL.")


# Parse a beautiful soup object return list of posts with descriptions etc


print_header("DATA EXTRACTION COMPLETE")
print("Piazza data successfully retrieved.")


