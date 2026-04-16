from .data_scrape_for_piazza import CANVAS_BASE_URL, get_paginated, print_header
from .llm_summary import summarize
import requests, time
from selenium import webdriver
from selenium.webdriver.common.by import By

session = requests.Session()
canvas_url = f"{CANVAS_BASE_URL}/api/v1/courses"

# =========================
# HELPERS
# =========================

def is_class_blocked(driver):
    try:
        span = driver.find_element(By.CSS_SELECTOR, "span[data-id='title_text']")
        return "post access blocked" in span.text.lower()
    except:
        return False


def get_paginated_session(url, HEADERS):
    time.sleep(1)
    results = []
    while url:
        r = session.get(url, headers=HEADERS)
        r.raise_for_status()
        results.extend(r.json())
        url = r.links.get("next", {}).get("url")
    return results


# =========================
# PIAZZA SCRAPER
# =========================

def get_piazza_posts(driver):
    if is_class_blocked(driver):
        print("Skipping blocked class")
        return []

    posts_data = []
    post_links = []

    course_name = driver.find_element(By.CSS_SELECTOR, "#topbar_current_class_number").text
    post_groups = driver.find_elements(By.CSS_SELECTOR, "div[data-id='post_group']")

    for group in post_groups:
        try:
            # Stop at "Last Week"
            try:
                week_span = group.find_element(By.CSS_SELECTOR, "span.d-flex.align-items-center")
                if week_span.text.strip()[:4] == "Week":
                    print("Reached 'Week' — stopping")
                    break
            except:
                pass

            posts_in_group = group.find_elements(By.CSS_SELECTOR, "li.feed_item")

            for post in posts_in_group:
                try:
                    id_wrapper = post.find_element(By.CSS_SELECTOR, ".feed-item-wrapper").get_attribute("id")
                    post_id = id_wrapper.replace("_wrapper", "")
                    base_url = driver.current_url.split("#")[0]
                    post_links.append(f"{base_url}/post/{post_id}")
                except:
                    continue

        except Exception as e:
            print("Group error:", e)
            continue

    print("Collected links:", len(post_links))

    # Visit each post
    for link in post_links:
        driver.get(link)
        time.sleep(2)

        try:
            content_div = driver.find_element(
                By.CSS_SELECTOR, "div.render-html-content.overflow-hidden.latex_process"
            )
            title = driver.find_element(By.ID, "postViewSummaryId").text

            try:
                post_date = driver.find_element(By.CSS_SELECTOR, "time").get_attribute("datetime")
            except:
                post_date = None

            desc = summarize(title + " : " + content_div.text)

            posts_data.append({
                "course": course_name,
                "title": title,
                "text": desc,
                "date": post_date,
                "url": link
            })

        except Exception as e:
            print(f"Skipping post {link}:", e)

    return posts_data


# =========================
# MAIN FUNCTION (IMPORTANT)
# =========================

def get_all_posts(CANVAS_API_KEY):
    all_posts = []
    HEADERS = {
        "Authorization": f"Bearer {CANVAS_API_KEY}"
    }
    courses = get_paginated_session(canvas_url, HEADERS)

    for course in courses:
        course_id = course["id"]
        course_name = course.get("name", "Unnamed Course")

        try:
            ext_tools = get_paginated(
                f"{CANVAS_BASE_URL}/api/v1/courses/{course_id}/external_tools/visible_course_nav_tools", CANVAS_API_KEY
            )
        except requests.exceptions.HTTPError:
            continue

        for tool in ext_tools:
            if "Piazza" not in tool.get("name", ""):
                continue

            print(f"\n{course_name}")
            print("Piazza integration detected")

            launch_url = f"{CANVAS_BASE_URL}/api/v1/courses/{course_id}/external_tools/sessionless_launch?url={tool.get('url', '')}"

            r = session.get(launch_url, headers=HEADERS)
            if r.status_code != 200:
                continue

            piazza_url = r.json().get("url", "")

            driver = webdriver.Chrome()

            try:
                driver.get("https://www.piazza.com")

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

                posts = get_piazza_posts(driver)
                all_posts.extend(posts)

            finally:
                driver.quit()

    return all_posts


# =========================
# RUN DIRECTLY (SAFE)
# =========================

if __name__ == "__main__":
    print_header("External Tools (Piazza)")
    posts = get_all_posts()
    print("\nTOTAL POSTS:", len(posts))