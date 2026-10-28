import { supabase } from "@/supabaseClient";
import { useEffect, useState } from "react";

// Every class name that has assignments or announcements, for the class filter
export const useCourses = (userId?: string, refreshKey = 0) => {
  const [courses, setCourses] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    Promise.all([
      supabase
        .from("assignments_duplicate")
        .select("course_name")
        .eq("user_id", userId),
      supabase.from("announcements").select("course").eq("user_id", userId),
    ]).then(([assignments, announcements]) => {
      if (cancelled) return;
      const names = new Set<string>();
      assignments.data?.forEach((r) => r.course_name && names.add(r.course_name));
      announcements.data?.forEach((r) => r.course && names.add(r.course));
      setCourses([...names].sort());
    });

    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  return courses;
};
