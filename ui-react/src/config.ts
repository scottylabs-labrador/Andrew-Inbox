// Where the Python backend is running. Override with VITE_BACKEND_URL in the root .env
// (and add the new origin to public/manifest.json) if the backend is ever hosted elsewhere.
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ?? "http://127.0.0.1:8000";
