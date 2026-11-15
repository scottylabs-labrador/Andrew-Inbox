import { supabase } from "@/supabaseClient";
import { useState, useEffect } from "react";
import { readJson, storageKey, writeJson } from "@/storage";

// Shown with each opened announcement, since the descriptions are LLM summaries
export const AI_NOTE =
  "Summaries are AI-generated and may miss details. Open the original post to be sure.";

// "piazza" -> "Piazza"
export const platformName = (platform: string) =>
  platform ? platform[0].toUpperCase() + platform.slice(1) : "";

export interface Announce {
  announcement_id: string;
  user_id: string;
  course: string;
  title: string;
  description: string;
  link: string;
  date: string;
  platform: string;
  is_read: boolean;
}

// The announcements, or null if Supabase returned an error
const loadAnnouncements = async (): Promise<Announce[] | null> => {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching announcements:", error.message);
    return null;
  }
  return data || [];
};

export const useAnnounce = (userId: string, refreshKey = 0) => {
  // Shown instantly from the last popup open, then replaced by the fresh copy
  const cacheKey = storageKey(userId, "announcements-cache");
  const [ann, setAnnState] = useState<Announce[] | null>(() =>
    readJson<Announce[]>(cacheKey),
  );
  const setAnn = (update: (prev: Announce[]) => Announce[]) =>
    setAnnState((prev) => {
      const next = update(prev ?? []);
      writeJson(cacheKey, next);
      return next;
    });

  // Spinner only until there's something to show (saved or fetched)
  const [loadedKey, setLoadedKey] = useState<number | null>(null);
  const loading = loadedKey !== refreshKey && ann === null;

  const fetchAnnouncements = async () => {
    const result = await loadAnnouncements();
    if (result) setAnn(() => result);
  };

  useEffect(() => {
    let cancelled = false;
    loadAnnouncements().then((result) => {
      // A later sync has started a newer fetch; drop this one
      if (cancelled) return;
      if (result) {
        setAnnState(result);
        writeJson(cacheKey, result);
      }
      setLoadedKey(refreshKey);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, cacheKey]);

  const toggleAnnounce = async (id: string, currentStatus: boolean) => {
    setAnn((prev) =>
      prev.map((t) =>
        t.announcement_id === id ? { ...t, is_read: !currentStatus } : t,
      ),
    );

    const { error } = await supabase
      .from("announcements")
      .update({ is_read: !currentStatus })
      .eq("announcement_id", id);

    if (error) {
      console.error("Error updating announcement:", error.message);
      fetchAnnouncements();
    }
  };

  return {
    ann: ann ?? [],
    loading,
    toggleAnnounce,
  };
};
