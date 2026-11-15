// Small localStorage helpers for remembering things between popup opens: where
// you were (tab, filters, an unfinished "Add assignment"), and a copy of your
// data so the popup can draw right away instead of waiting on Supabase.
//
// The popup is torn down every time it closes, so anything kept only in React
// state is lost. localStorage can be missing or full (private windows, cleared
// site data), so every read and write here is wrapped and failures are ignored.
import { useCallback, useState } from "react";

const PREFIX = "andrew-inbox-";

export const storageKey = (userId: string, name: string) =>
  `${PREFIX}${name}-${userId}`;

export function readJson<T>(key: string): T | null {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable or full: it just won't be remembered
  }
}

export function removeKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to do
  }
}

// On sign-out: drop the saved copy of this user's data and their drafts, so the
// next person on this computer doesn't see them.
export function clearUserStorage(userId: string) {
  try {
    const mine = Object.keys(localStorage).filter(
      (k) => k.startsWith(PREFIX) && k.endsWith(`-${userId}`),
    );
    mine.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Nothing to do
  }
}

// useState that survives closing and reopening the popup
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readJson<T>(key) ?? initial);
  const set = useCallback(
    (next: T) => {
      setValue(next);
      writeJson(key, next);
    },
    [key],
  );
  return [value, set] as const;
}
