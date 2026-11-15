import { supabase } from "@/supabaseClient";
import { useState, useEffect } from "react";
import { KEEP_DONE_DAYS, addDays } from "@/dates";
import { readJson, storageKey, writeJson } from "@/storage";

export interface Task {
  id: string;
  assignment: string;
  course: string;
  due: Date;
  status: boolean;
  points: number | null;
  platform: string | null;
  userId: string;
}

// "YYYY-MM-DD" from the task form -> 11:59 PM that day in the user's timezone
export const endOfDayIso = (day: string) =>
  new Date(`${day}T23:59:00`).toISOString();

// A row of the assignments_duplicate table (supabase/schema.sql)
interface AssignmentRow {
  assignment_id: string | null;
  assignment_name: string;
  course_name: string;
  due_date: string | null;
  status: boolean | null;
  points_possible: number | null;
  platform: string | null;
  user_id: string;
}

// Keep the full timestamp. Cutting it to the date part used the UTC date, so
// 11:59 PM Eastern (03:59 UTC the next day) showed up as due tomorrow.
const parseDueDate = (dateStr: string | null | undefined) =>
  dateStr ? new Date(dateStr) : new Date();

// The user's assignments, or null if Supabase returned an error
const loadTasks = async (userId: string): Promise<Task[] | null> => {
  const { data, error } = await supabase
    .from("assignments_duplicate")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true })
    .limit(2000);

  if (error) {
    console.error("Fetch error:", error);
    return null;
  }
  const hydratedData: Task[] = ((data ?? []) as AssignmentRow[]).map((row) => ({
    id: row.assignment_id || `temp-${Math.random()}`,
    assignment: row.assignment_name,
    course: row.course_name,
    due: parseDueDate(row.due_date),
    status: row.status || false,
    points: row.points_possible,
    platform: row.platform,
    userId: row.user_id,
  }));
  // Finished work more than a month old is hidden, but stays in the database:
  // its row is what remembers you ticked it off. Deleting it made the next
  // fetch re-add it from Canvas as not done, back in Overdue. The backend
  // removes old rows once they're past the semester window (retention.py).
  const cutoff = addDays(new Date(), -KEEP_DONE_DAYS);
  return hydratedData.filter((t) => !(t.status && t.due < cutoff));
};

// The last list loaded from Supabase, shown instantly on the next popup open
// while the fresh copy loads
const cacheKey = (userId: string) => storageKey(userId, "tasks-cache");
type CachedTask = Omit<Task, "due"> & { due: string };

const readCachedTasks = (userId?: string): Task[] | null => {
  if (!userId) return null;
  const saved = readJson<CachedTask[]>(cacheKey(userId));
  return saved ? saved.map((t) => ({ ...t, due: new Date(t.due) })) : null;
};

// Pass the signed-in user's id to the hook
export const useTasks = (currentUsername?: string, refreshKey = 0) => {
  const [todos, setTodos] = useState<Task[]>(
    () => readCachedTasks(currentUsername) ?? [],
  );
  // Which user `todos` belongs to (cached or fetched); null until there's any
  const [shownUser, setShownUser] = useState<string | null>(() =>
    readCachedTasks(currentUsername) ? (currentUsername ?? null) : null,
  );

  // Spinner only when there's nothing to show yet for this user. With a saved
  // copy, the list draws right away and quietly updates when the fetch is back.
  const fetchKey = `${currentUsername ?? ""}|${refreshKey}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading =
    Boolean(currentUsername) &&
    loadedKey !== fetchKey &&
    shownUser !== currentUsername;

  // Keep the saved copy in step with every change (fetches, check-offs, edits)
  useEffect(() => {
    if (currentUsername && shownUser === currentUsername) {
      writeJson(cacheKey(currentUsername), todos);
    }
  }, [todos, currentUsername, shownUser]);

  // Re-fetch whenever the user logs in or changes, or after a sync
  useEffect(() => {
    if (!currentUsername) return;
    let cancelled = false;
    loadTasks(currentUsername).then((tasks) => {
      // A newer fetch (other user / later sync) has started; drop this one
      if (cancelled) return;
      if (tasks) {
        setTodos(tasks);
        setShownUser(currentUsername);
      }
      setLoadedKey(fetchKey);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUsername, fetchKey]);

  const addAssignment = async (
    data: {
      assignment: string;
      course: string;
      due: string;
      points?: number;
      platform?: string;
    },
    userId: string,
  ) => {
    const nextId = crypto.randomUUID
      ? crypto.randomUUID()
      : (Date.now() + Math.random()).toString();

    // The form gives "YYYY-MM-DD"; treat hand-added work as due 11:59 PM that day
    const isoDate = endOfDayIso(data.due);

    const { data: insertedData, error } = await supabase
      .from("assignments_duplicate")
      .insert([
        {
          assignment_id: nextId,
          assignment_name: data.assignment,
          course_name: data.course,
          due_date: isoDate,
          status: false,
          points_possible: data.points || 0,
          platform: data.platform || "manual",
          user_id: userId,
          retrieved_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Add error:", error);
    } else if (insertedData) {
      const newRow = insertedData[0];
      const newTask: Task = {
        id: newRow.assignment_id,
        assignment: newRow.assignment_name,
        course: newRow.course_name,
        due: parseDueDate(newRow.due_date),
        status: newRow.status,
        points: newRow.points_possible,
        platform: newRow.platform,
        userId: newRow.user_id,
      };
      setTodos((prev) => [newTask, ...prev]);
    }
  };

  const toggleAssignment = async (id: string) => {
    const taskToToggle = todos.find((t) => t.id === id);
    if (!taskToToggle) return;

    const originalStatus = taskToToggle.status;
    const nextStatus = !originalStatus;

    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t)),
    );

    const { error } = await supabase
      .from("assignments_duplicate")
      .update({ status: nextStatus })
      .eq("assignment_id", id);

    if (error) {
      console.error("Update error:", error);
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: originalStatus } : t)),
      );
    }
  };

  const updateAssignment = async (id: string, updatedFields: Partial<Task>) => {
    const dbPayload: Partial<AssignmentRow> = {};
    if (updatedFields.assignment)
      dbPayload.assignment_name = updatedFields.assignment;
    if (updatedFields.course) dbPayload.course_name = updatedFields.course;
    if (updatedFields.due) dbPayload.due_date = updatedFields.due.toISOString();
    if (updatedFields.status !== undefined)
      dbPayload.status = updatedFields.status;

    const { error } = await supabase
      .from("assignments_duplicate")
      .update(dbPayload)
      .eq("assignment_id", id);

    if (!error) {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)),
      );
    }
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase
      .from("assignments_duplicate")
      .delete()
      .eq("assignment_id", id);
    if (error) console.error("Delete error:", error);
    else setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    todos,
    loading,
    addAssignment,
    toggleAssignment,
    updateAssignment,
    deleteAssignment,
  };
};
