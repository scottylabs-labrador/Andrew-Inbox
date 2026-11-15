import { supabase } from "@/supabaseClient";
import { ANNOUNCEMENT_DAYS, addDays, getSemesterRange, startOfDay } from "@/dates";
import { useEffect, useState } from "react";
import { readJson, storageKey, writeJson } from "@/storage";

// This semester's classes (ones with assignments this semester or
// announcements this week), for the class filter and class colors
export const useCourses = (userId?: string, refreshKey = 0) => {
  // Last list seen, so the class filter and colors are right on the first draw
  const [courses, setCourses] = useState<string[]>(
    () => (userId && readJson<string[]>(storageKey(userId, "courses-cache"))) || [],
  );

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const { start, end } = getSemesterRange();

    Promise.all([
      supabase
        .from("assignments_duplicate")
        .select("course_name")
        .eq("user_id", userId)
        .gte("due_date", start.toISOString())
        .lt("due_date", end.toISOString()),
      supabase
        .from("announcements")
        .select("course")
        .eq("user_id", userId)
        .gte(
          "date",
          addDays(startOfDay(new Date()), 1 - ANNOUNCEMENT_DAYS).toISOString(),
        ),
    ]).then(([assignments, announcements]) => {
      if (cancelled) return;
      const names = new Set<string>();
      assignments.data?.forEach((r) => r.course_name && names.add(r.course_name));
      announcements.data?.forEach((r) => r.course && names.add(r.course));
      // Keep the saved list if Supabase couldn't be reached
      if (assignments.error || announcements.error) return;
      const list = [...names].sort();
      setCourses(list);
      writeJson(storageKey(userId, "courses-cache"), list);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  return courses;
};
