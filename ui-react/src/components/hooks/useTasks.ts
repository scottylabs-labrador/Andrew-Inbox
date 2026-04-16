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

// Pass the current user's username/ID to the hook
export const useTasks = (currentUsername?: string) => {
  const [todos, setTodos] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const parseLocalDatePicker = (dateStr: string | null | undefined) => {
    if (!dateStr) return new Date();
    const dateOnly = dateStr.split("T")[0];
    return new Date(dateOnly.replace(/-/g, "/"));
  };

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
        due: parseLocalDatePicker(row.due_date),
        status: row.status || false,
        points: row.points_possible,
        platform: row.platform,
        userId: row.user_id,
      }));
      setTodos(hydratedData);
    }
    setLoading(false);
  };

  // Re-fetch whenever the user logs in or changes
  useEffect(() => {
    fetchTasks();
  }, [currentUsername]);

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

    const localDate = new Date(data.due.replace(/-/g, "/"));
    const isoDate = localDate.toISOString();

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
        due: parseLocalDatePicker(newRow.due_date),
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
