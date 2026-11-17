# Headless Chrome for the Gradescope and Piazza logins. Containers need
# --no-sandbox and --disable-dev-shm-usage; laptops are fine with them too.

import os

from selenium import webdriver
from selenium.webdriver.chrome.options import Options


def new_chrome():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    binary = os.getenv("CHROME_BIN") or os.getenv("GOOGLE_CHROME_BIN")
    if binary:
        options.binary_location = binary
    return webdriver.Chrome(options=options)
