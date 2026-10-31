import { useCallback, useState } from "react";
import { BACKEND_URL } from "@/config";
import { supabase } from "@/supabaseClient";

// Fetch runs by itself when the popup opens if the last one was this long ago
export const AUTO_FETCH_DAYS = 7;

const lastFetchKey = (userId: string) => `andrew-inbox-last-fetch-${userId}`;

export function getLastFetch(userId: string): Date | null {
  try {
    const saved = localStorage.getItem(lastFetchKey(userId));
    return saved ? new Date(saved) : null;
  } catch {
    return null;
  }
}

export function isFetchDue(userId: string, now = new Date()) {
  const last = getLastFetch(userId);
  return !last || now.getTime() - last.getTime() > AUTO_FETCH_DAYS * 864e5;
}

export const INVALID_TOKEN_MESSAGE =
  "Your Canvas token isn't working. It may have expired or been deleted. Replace it with a new one in Settings.";

export const useBackend = (userId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Canvas rejected the saved token, so the user needs to paste a new one
  const [canvasTokenInvalid, setCanvasTokenInvalid] = useState(false);

  const executeSync = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCanvasTokenInvalid(false);

    try {
      // The backend works out who you are from your sign-in session.
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Please sign in again.");

      const response = await fetch(`${BACKEND_URL}/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = errorData.detail;
        if (detail?.code === "invalid_canvas_token") {
          setCanvasTokenInvalid(true);
          throw new Error(INVALID_TOKEN_MESSAGE);
        }
        throw new Error(
          (typeof detail === "string" ? detail : detail?.message) || `Fetch failed: ${response.status}`,
        );
      }

      if (userId) {
        try {
          localStorage.setItem(lastFetchKey(userId), new Date().toISOString());
        } catch {
          // Storage unavailable: it just fetches again next time
        }
      }
      return await response.json();
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Can't reach the backend. Start it with start-backend and try again."
          : err instanceof Error
            ? err.message
            : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // After a new token is saved, hide the warning until the next fetch says otherwise
  const clearCanvasTokenError = useCallback(() => {
    setCanvasTokenInvalid(false);
    setError(null);
  }, []);

  return { executeSync, loading, error, canvasTokenInvalid, clearCanvasTokenError };
};
