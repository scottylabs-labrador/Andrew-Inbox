import { supabase } from "@/supabaseClient";
import { useState, useEffect } from "react";

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

// Pass the signed-in user's id to the hook
export const useTasks = (currentUsername?: string, refreshKey = 0) => {
  const [todos, setTodos] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Keep the full timestamp. Cutting it to the date part used the UTC date, so
  // 11:59 PM Eastern (03:59 UTC the next day) showed up as due tomorrow.
  const parseDueDate = (dateStr: string | null | undefined) =>
    dateStr ? new Date(dateStr) : new Date();

  const fetchTasks = async () => {
    if (!currentUsername) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("assignments_duplicate")
      .select("*")
      .eq("user_id", currentUsername)
      .order("due_date", { ascending: true })
      .limit(2000);

    if (error) {
      console.error("Fetch error:", error);
    } else if (data) {
      const hydratedData = data.map((row: any) => ({
        id: row.assignment_id || `temp-${Math.random()}`,
        assignment: row.assignment_name,
        course: row.course_name,
        due: parseDueDate(row.due_date),
        status: row.status || false,
        points: row.points_possible,
        platform: row.platform,
        userId: row.user_id,
      }));
      setTodos(hydratedData);
    }
    setLoading(false);
  };

  // Re-fetch whenever the user logs in or changes, or after a sync
  useEffect(() => {
    fetchTasks();
  }, [currentUsername, refreshKey]);

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
    const isoDate = new Date(`${data.due}T23:59:00`).toISOString();

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
    const dbPayload: any = {};
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

  return {
    todos,
    loading,
    addAssignment,
    toggleAssignment,
    updateAssignment,
    fetchTasks,
  };
};
