import { supabase } from "@/supabaseClient";
import { useState, useEffect } from "react";

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

export const useAnnounce = (refreshKey = 0) => {
  const [ann, setAnn] = useState<Announce[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching announcements:", error.message);
    } else {
      setAnn(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [refreshKey]);

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
    ann,
    loading,
    toggleAnnounce,
  };
};
