import { useState, useEffect } from "react";

export interface Task {
  id: number;
  assignment: string;
  course: string;
  due: Date;
  platform: string;
  checked: boolean;
}

interface NewTaskData {
  assignment: string;
  course: string;
  due: string;
}

export const useTasks = () => {
  const [todos, setTodos] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Just fetch the JSON directly
    fetch("/testing.json")
      .then((res) => {
        if (!res.ok) throw new Error("Could not find data");
        return res.json();
      })
      .then((data: any[]) => {
        const hydratedData = data.map((task) => ({
          ...task,
          due: new Date(task.due),
          checked: !!task.checked,
        }));
        setTodos(hydratedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  const addAssignment = (data: NewTaskData) => {
    const newTodo: Task = {
      id: Date.now(),
      assignment: data.assignment,
      course: data.course,
      due: new Date(data.due),
      platform: "Manual",
      checked: false,
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

  const toggleAssignment = (id: number) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t)),
    );
  };

  return {
    todos,
    loading,
    addAssignment,
    deleteAssignment,
    updateAssignment,
    toggleAssignment,
  };
};
