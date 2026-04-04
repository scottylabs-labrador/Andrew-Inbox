import { supabase } from "@/supabaseClient";
import { useState, useEffect } from "react";

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

export const useAnnounce = () => {
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
  }, []);

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
