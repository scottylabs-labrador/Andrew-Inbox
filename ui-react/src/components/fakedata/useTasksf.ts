import { useState } from "react";
import taskData from "./testingf.json";

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

export const useTasksf = () => {
  const [todos, setTodos] = useState<Task[]>(
    taskData.map((task) => ({
      ...task,
      due: new Date(task.due),
      checked: !!task.checked,
    })),
  );

  const loading = false;

  const addAssignment = (data: NewTaskData) => {
    const [year, month, day] = data.due.split("-").map(Number);
    const newTodo: Task = {
      id: Date.now(),
      assignment: data.assignment,
      course: data.course,
      due: new Date(year, month - 1, day),
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
