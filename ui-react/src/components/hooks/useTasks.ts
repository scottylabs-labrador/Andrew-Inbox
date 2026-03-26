import { supabase } from "@/supabaseClient";
import { useState, useEffect } from "react";

export interface Task {
  id: number;
  assignment: string;
  course: string;
  due: Date;
  status: boolean;
  points: number | null;
  platform: string | null;
}

export const useTasks = () => {
  const [todos, setTodos] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Fetch error:", error);
    } else if (data) {
      const hydratedData = data.map((row: any) => ({
        id: row.assignment_id,
        assignment: row.assignment_name,
        course: row.course_name,
        due: new Date(row.due_date),
        status: row.status || false,
        points: row.points_possible,
        platform: row.platform,
      }));
      setTodos(hydratedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleAssignment = async (id: number) => {
    const taskToToggle = todos.find((t) => t.id === id);
    if (!taskToToggle) return;

    const originalStatus = taskToToggle.status;
    const nextStatus = !originalStatus;

    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t)),
    );

    const { error } = await supabase
      .from("assignments")
      .update({ status: nextStatus })
      .eq("assignment_id", id);

    if (error) {
      console.error("Database update failed, rolling back:", error);
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: originalStatus } : t)),
      );
    }
  };

  const addAssignment = async (data: {
    assignment: string;
    course: string;
    due: string;
    points?: number;
    platform?: string;
  }) => {
    const { data: insertedData, error } = await supabase
      .from("assignments")
      .insert([
        {
          assignment_name: data.assignment,
          course_name: data.course,
          due_date: new Date(data.due).toISOString(),
          points_possible: data.points || 0,
          platform: data.platform || "manual",
          status: false,
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
        due: new Date(newRow.due_date),
        status: newRow.status,
        points: newRow.points_possible,
        platform: newRow.platform,
      };
      setTodos((prev) => [newTask, ...prev]);
    }
  };

  const deleteAssignment = async (id: number) => {
    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("assignment_id", id);

    if (!error) setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const updateAssignment = async (id: number, updatedFields: Partial<Task>) => {
    const dbPayload: any = {};
    if (updatedFields.assignment)
      dbPayload.assignment_name = updatedFields.assignment;
    if (updatedFields.course) dbPayload.course_name = updatedFields.course;
    if (updatedFields.due) dbPayload.due_date = updatedFields.due.toISOString();
    if (updatedFields.status !== undefined)
      dbPayload.status = updatedFields.status;

    const { error } = await supabase
      .from("assignments")
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
    deleteAssignment,
    toggleAssignment,
    updateAssignment,
    fetchTasks,
  };
};
