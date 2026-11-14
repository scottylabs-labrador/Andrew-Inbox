#!/usr/bin/env bash
# Sets up (first run only) and starts the Andrew Inbox backend on macOS / Linux.
# Run it from a terminal with:  ./start-backend.sh
set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "[!] Missing the .env file in the Andrew-Inbox folder. See the README."
  exit 1
fi

# Find a Python 3.12+ install.
PY=""
for candidate in python3.13 python3.12 python3 python; do
  if command -v "$candidate" >/dev/null 2>&1 &&
     "$candidate" -c "import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)" 2>/dev/null; then
    PY="$candidate"
    break
  fi
done
if [ -z "$PY" ]; then
  echo "[!] Python 3.12 or newer was not found. Install it from https://www.python.org/downloads"
  exit 1
fi

cd backend
VENV_PY=".venv/bin/python"

# Recreate the environment if it's missing or was made on another computer.
if ! "$VENV_PY" -c "" >/dev/null 2>&1; then
  echo "Creating the Python environment (first run only)..."
  "$PY" -m venv --clear .venv
  rm -f .venv/.installed-requirements.txt
fi

# Reinstall packages only when requirements.txt has changed since the last install.
if ! cmp -s requirements.txt .venv/.installed-requirements.txt; then
  echo "Installing Python packages (this can take a few minutes)..."
  "$VENV_PY" -m pip install --upgrade pip >/dev/null
  "$VENV_PY" -m pip install -r requirements.txt
  cp requirements.txt .venv/.installed-requirements.txt
fi

echo
echo "Starting the Andrew Inbox backend at http://127.0.0.1:8000"
echo "Keep this window open while you use the extension. Press Ctrl+C to stop."
echo
exec "$VENV_PY" -m uvicorn main:app --host 127.0.0.1 --port 8000
