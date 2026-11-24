import { useCallback, useState } from "react";
import { BACKEND_URL } from "@/config";
import { supabase } from "@/supabaseClient";

// Fetch runs by itself when the popup opens if the last one was this long ago.
// Kept short so work handed in on Gradescope/Canvas is marked done soon after,
// instead of sitting in Overdue until the next manual fetch.
export const AUTO_FETCH_HOURS = 1;

// A fetch takes a minute or two and keeps running on the backend if the popup
// is closed, so don't start another one on every reopen while it finishes.
const FETCH_RETRY_MINUTES = 10;

const lastFetchKey = (userId: string) => `andrew-inbox-last-fetch-${userId}`;
const lastAttemptKey = (userId: string) => `andrew-inbox-last-fetch-attempt-${userId}`;

const readDate = (key: string) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? new Date(saved) : null;
  } catch {
    return null;
  }
};

const saveDate = (key: string) => {
  try {
    localStorage.setItem(key, new Date().toISOString());
  } catch {
    // Storage unavailable: it just fetches again next time
  }
};

export function getLastFetch(userId: string): Date | null {
  return readDate(lastFetchKey(userId));
}

// A fetch was started (within the retry window) and the popup closed before it
// reported back. The backend keeps going, so on reopen the popup rejoins it.
export function isFetchPending(userId: string, now = new Date()) {
  const last = getLastFetch(userId);
  const attempt = readDate(lastAttemptKey(userId));
  return (
    !!attempt &&
    (!last || attempt > last) &&
    now.getTime() - attempt.getTime() < FETCH_RETRY_MINUTES * 6e4
  );
}

export function isFetchDue(userId: string, now = new Date()) {
  const last = getLastFetch(userId);
  const attempt = readDate(lastAttemptKey(userId));
  // The clock starts when a fetch is sent, not when it finishes. Closing the
  // popup mid-fetch must not make the next open start another one.
  const stamp = last && attempt ? (last > attempt ? last : attempt) : last || attempt;
  return !stamp || now.getTime() - stamp.getTime() > AUTO_FETCH_HOURS * 36e5;
}

export const INVALID_TOKEN_MESSAGE =
  "Your Canvas token isn't working. It may have expired or been deleted. Replace it with a new one in Settings.";

export const useBackend = (userId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Canvas rejected the saved token, so the user needs to paste a new one
  const [canvasTokenInvalid, setCanvasTokenInvalid] = useState(false);
  // Optional sources (like Ed) don't stop a fetch; the backend lists them as warnings
  const [edTokenInvalid, setEdTokenInvalid] = useState(false);

  // join: only wait for a fetch that's already running (never starts one)
  const executeSync = useCallback(async ({ join = false } = {}) => {
    setLoading(true);
    setError(null);
    setCanvasTokenInvalid(false);
    if (userId && !join) {
      saveDate(lastAttemptKey(userId));
      // Count this hour even if the popup closes before the server answers.
      saveDate(lastFetchKey(userId));
    }

    try {
      // The backend works out who you are from your sign-in session.
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Please sign in again.");

      const response = await fetch(`${BACKEND_URL}/sync${join ? "?join=true" : ""}`, {
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

      const result = await response.json();
      // "idle": it finished (or stopped) while the popup was closed; the
      // caller still reloads, but it doesn't count as a fresh fetch
      if (userId && result.status !== "idle") saveDate(lastFetchKey(userId));
      setEdTokenInvalid(result.warnings?.includes("invalid_edstem_token") ?? false);
      return result;
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

  const clearEdTokenError = useCallback(() => setEdTokenInvalid(false), []);

  return {
    executeSync,
    loading,
    error,
    canvasTokenInvalid,
    clearCanvasTokenError,
    edTokenInvalid,
    clearEdTokenError,
  };
};
