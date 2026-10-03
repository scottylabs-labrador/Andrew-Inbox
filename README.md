steps to install dependencies:

In one terminal:  
cd ui-react  
npm i

In the other terminal:  
cd backend  
source .venv/bin/activate

back in the first terminal:  
npm run dev  

back in the second terminal:  
uvicorn main:app --reload --host 0.0.0.0 --port 8000  

steps to build as a chrome extension:  

cd ui-react  
npm run build  
in chrome, go to chrome://extensions, and open andrew-inbox in "Load Unpacked"  
