@echo off
rem Sets up (first run only) and starts the Andrew Inbox backend on Windows.
rem Double-click this file, or run start-backend.bat from a terminal.
setlocal
cd /d "%~dp0"

if not exist ".env" (
  echo.
  echo [!] Missing the .env file in the Andrew-Inbox folder. See the README.
  goto :fail
)

rem Find a Python 3.12+ install: the "py" launcher first, then "python".
set "PY="
py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)" >nul 2>&1 && set "PY=py -3"
if not defined PY (
  python -c "import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)" >nul 2>&1 && set "PY=python"
)
if not defined PY (
  echo.
  echo [!] Python 3.12 or newer was not found. Install it from https://www.python.org/downloads
  echo     and tick "Add python.exe to PATH" in the installer.
  goto :fail
)

cd backend
set "VENV_PY=.venv\Scripts\python.exe"

rem Recreate the environment if it's missing or damaged. A venv that has lost its
rem pyvenv.cfg (e.g. a cloud-sync tool like OneDrive renamed or dropped it) still
rem runs, but as the system Python, so pip would install into the global Python.
"%VENV_PY%" -c "import sys; sys.exit(sys.prefix == sys.base_prefix)" >nul 2>&1
if errorlevel 1 (
  echo Creating the Python environment ^(first run only^)...
  %PY% -m venv --clear .venv || goto :fail
  del /q ".venv\.installed-requirements.txt" >nul 2>&1
)

rem Reinstall packages only when requirements.txt has changed since the last install.
fc /b requirements.txt ".venv\.installed-requirements.txt" >nul 2>&1
if errorlevel 1 (
  echo Installing Python packages ^(this can take a few minutes^)...
  "%VENV_PY%" -m pip install --upgrade pip >nul
  "%VENV_PY%" -m pip install -r requirements.txt || goto :fail
  copy /y requirements.txt ".venv\.installed-requirements.txt" >nul
)

echo.
echo Starting the Andrew Inbox backend at http://127.0.0.1:8000
echo Keep this window open while you use the extension. Close it to stop.
echo.
"%VENV_PY%" -m uvicorn main:app --host 127.0.0.1 --port 8000
goto :eof

:fail
echo.
pause
exit /b 1
