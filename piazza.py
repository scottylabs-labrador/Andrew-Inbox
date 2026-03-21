# REQUIRES CANVAS DATA SCRAPE TO BE RUN FIRST TO GET COURSES (change line 1 to match file name))
from data_scrape_for_piazza import CANVAS_BASE_URL, HEADERS, get_paginated, print_header
from llm_summary import summarize
import requests, time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoAlertPresentException

# =========================
# 4. PIAZZA LOGIN (IF APPLICABLE)
# =========================

print_header("External Tools (Piazza)")

session = requests.Session()

canvas_url = f"{CANVAS_BASE_URL}/api/v1/courses"

def is_class_blocked(driver):
    try:
        span = driver.find_element(By.CSS_SELECTOR, "span[data-id='title_text']")
        if "post access blocked" in span.text.lower():
            print("Skipping class: detected title_text span (blocked)")
            return True
        return False
    except:
        return False

all_posts = []

def get_all_posts():
    return all_posts

def get_piazza_posts(driver):
    if is_class_blocked(driver):
        return []

    
    posts_data = [];
    post_links = []

    course_name = driver.find_element(By.CSS_SELECTOR, "#topbar_current_class_number").text
    post_groups = driver.find_elements(By.CSS_SELECTOR, "div[data-id='post_group']")

    print(len(posts))

    for group in post_groups:
        try:
            week_span = group.find_element(By.CSS_SELECTOR, "span.d-flex.align-items-center")
            week_text = week_span.text

            if "last week" in week_text.lower():
                print("Reached 'Last Week' group — stopping link collection.")
                break

            posts_in_group = group.find_elements(By.CSS_SELECTOR, "li.feed_item")
            for post in posts_in_group:
                try:
                    id_wrapper = post.find_element(By.CSS_SELECTOR, ".feed-item-wrapper").get_attribute("id")
                    post_id = id_wrapper.replace("_wrapper", "")
                    base_url = driver.current_url.split("#")[0]
                    post_url = f"{base_url}/post/{post_id}"
                    post_links.append(post_url)
                except Exception as e:
                    print("Error looping through post in post groups")
                    continue
            

        except Exception as e:
            print("Skipped post:", e)
            continue

    print("Collected links:", len(post_links))
    for link in post_links:
        driver.get(link)
        time.sleep(2)  # small delay for page load
        try:
            content_div = driver.find_element(
                By.CSS_SELECTOR, "div.render-html-content.overflow-hidden.latex_process"
            )

            title_div = driver.find_element(By.ID, "postViewSummaryId")
            title = title_div.text

            post_date = None
            try:
                time_elem = driver.find_element(By.CSS_SELECTOR, "time")
                post_date = time_elem.get_attribute("datetime")
            except:
                post_date = None
                print(f"Couldn't get post date!")

            desc = summarize(title + " : " + content_div.text)

            posts_data.append({
                "course" : course_name,
                "title" : title,
                "text": desc,
                "date": post_date,
                "url": link
            })
        except:
            print(f"Could not retrieve post at {link} — skipping.")
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
                all_posts.append(posts)
                # print(posts)

                driver.quit()
                
            else:
                print("Failed to access Piazza URL.")


# Parse a beautiful soup object return list of posts with descriptions etc



print_header("DATA EXTRACTION COMPLETE")
print("Piazza data successfully retrieved.")

