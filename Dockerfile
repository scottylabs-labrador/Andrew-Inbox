# Backend for Render: FastAPI plus the headless Chrome that the Gradescope and
# Piazza logins need.
FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    CHROME_BIN=/usr/bin/google-chrome

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl gnupg fonts-liberation \
    && curl -fsSL https://dl.google.com/linux/linux_signing_key.pub \
        | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
        > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY config.py config.py
COPY backend backend

WORKDIR /app/backend
# Fails the build if Chrome can't start, and caches the matching chromedriver
# so the first fetch doesn't have to download it.
RUN python -c "from chrome_driver import new_chrome; d = new_chrome(); d.get('about:blank'); d.quit()"
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]
