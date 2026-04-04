import { supabase } from "@/supabaseClient";
import { useState, useEffect } from "react";

export interface Task {
  id: number;
  assignment: string;
  course: string;
  due: Date;
  checked: boolean;
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
        id: row.id,
        assignment: row.assignment_name,
        course: row.course_name,
        due: new Date(row.due_date),
        checked: row.checked || false,
      }));
      setTodos(hydratedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleAssignment = (id: number) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t)),
    );
  };

  const addAssignment = async (data: {
    assignment: string;
    course: string;
    due: string;
  }) => {
    const { data: insertedData, error } = await supabase
      .from("assignments")
      .insert([
        {
          assignment_name: data.assignment,
          course_name: data.course,
          due_date: new Date(data.due).toISOString(),
          retrieved_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) console.error("Add error:", error);
    else if (insertedData) {
      const newRow = insertedData[0];
      const newTask: Task = {
        id: newRow.id,
        assignment: newRow.assignment_name,
        course: newRow.course_name,
        due: new Date(newRow.due_date),
        checked: false,
      };
      setTodos((prev) => [newTask, ...prev]);
    }
  };

  const deleteAssignment = async (id: number) => {
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (!error) setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const updateAssignment = async (id: number, updatedFields: Partial<Task>) => {
    const dbPayload: any = {};
    if (updatedFields.assignment)
      dbPayload.assignment_name = updatedFields.assignment;
    if (updatedFields.course) dbPayload.course_name = updatedFields.course;
    if (updatedFields.due) dbPayload.due_date = updatedFields.due.toISOString();

    const { error } = await supabase
      .from("assignments")
      .update(dbPayload)
      .eq("id", id);

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
  };
};
