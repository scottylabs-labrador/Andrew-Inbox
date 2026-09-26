steps to install dependencies: Frontend

cd ui-react
npm i
add .env to the ui-react folder
you have the keys alr
Backend

cd backend
run "source .venv/bin/activate"
steps to run demo:

on ui-react/ run "npm run dev"
on backend/ run "uvicorn main:app --reload --host 0.0.0.0 --port 8000"
steps to build as a chrome extension:

cd ui-react
npm run build
in chrome, go to chrome://extensions, and open andrew-inbox in "Load Unpacked"
