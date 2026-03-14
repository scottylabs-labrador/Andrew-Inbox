import { useState, useEffect } from "react";

export interface Task {
  id: number;
  assignment: string;
  course: string;
  due: string;
  platform: string;
}

export const useTasks = () => {
  const [todos, setTodos] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Just fetch the JSON directly
    fetch("/testing.json")
      .then((res) => {
        if (!res.ok)
          throw new Error("Could not find todos.json in public folder");
        return res.json();
      })
      .then((data: Task[]) => {
        setTodos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  const addAssignment = (
    assignment: string,
    course: string,
    dueDate: string,
    platform: string,
  ) => {
    const newTodo: Task = {
      id: Date.now(),
      assignment,
      course,
      due: dueDate,
      platform,
    };
    setTodos((prev) => [newTodo, ...prev]);
  };

  const deleteAssignment = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const updateAssignment = (id: number, updatedFields: Partial<Task>) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)),
    );
  };

  return { todos, loading, addAssignment, deleteAssignment, updateAssignment };
};
