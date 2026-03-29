import {
  Box,
  Center,
  Dialog,
  HStack,
  IconButton,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import { useTasks } from "../hooks/useTasks";
import TaskCard from "./TaskCard";
import { LuPlus } from "react-icons/lu";
import TaskForm from "./TaskForm";
import { useState } from "react";

interface Props {
  filter: string;
}

const emptyMessages: Record<string, string> = {
  All: "No assignments yet! Time to relax?  ☕️",
  Day: "Nothing due today!  🎉",
  Week: "The rest of the week looks clear!  🏖️",
  Month: "No deadlines in this month!  🗓️",
};

export default function TasksPage({ filter }: Props) {
  const { todos, loading, addAssignment, toggleAssignment } = useTasks();
  const [isOpen, setIsOpen] = useState(false);

  const getSemesterRange = () => {
    const now = new Date();
    const year = now.getFullYear();

    if (now >= new Date(year, 7, 25) && now <= new Date(year, 11, 20)) {
      return { start: new Date(year, 7, 25), end: new Date(year, 11, 20) };
    }
    if (now >= new Date(year, 11, 21) || now <= new Date(year, 4, 7)) {
      const startYear = now.getMonth() === 11 ? year : year - 1;
      const endYear = now.getMonth() === 11 ? year + 1 : year;
      return {
        start: new Date(startYear, 11, 21),
        end: new Date(endYear, 4, 7),
      };
    }
    return { start: new Date(year, 4, 8), end: new Date(year, 7, 24) };
  };

  if (loading) {
    return (
      <Center h="200px">
        <HStack>
          <p> Loading </p>
          <Spinner color="blue.500" />
        </HStack>
      </Center>
    );
  }

  const { start, end } = getSemesterRange();

  const filteredTodos = todos.filter((task) => {
    const rawTaskDate = new Date(task.due);

    if (rawTaskDate < start || rawTaskDate > end) return false;

    if (filter === "All") return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(
      rawTaskDate.getFullYear(),
      rawTaskDate.getMonth(),
      rawTaskDate.getDate(),
    );

    if (taskDate < today && !task.status) {
      return true;
    }

    if (filter === "Day") {
      return taskDate.getTime() === today.getTime();
    }

    if (filter === "Week") {
      const sunday = new Date(today);
      sunday.setDate(today.getDate() + (6 - today.getDay()));
      return taskDate <= sunday && taskDate >= today;
    }

    if (filter === "Month") {
      return (
        taskDate.getMonth() === today.getMonth() &&
        taskDate.getFullYear() === today.getFullYear()
      );
    }

    return false;
  });

  const sortedTasks = [...filteredTodos].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status ? 1 : -1;
    }
    return new Date(a.due).getTime() - new Date(b.due).getTime();
  });

  return (
    <>
      <Dialog.Root
        size="sm"
        open={isOpen}
        onOpenChange={(e) => setIsOpen(e.open)}
        placement="center"
      >
        <VStack gap={3} align="stretch" w="100%" p={4}>
          {sortedTasks.length > 0 ? (
            sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                taskd={task}
                onToggle={() => toggleAssignment(task.id)}
              />
            ))
          ) : (
            <Center py={10} flexDirection="column">
              <p style={{ color: "gray", textAlign: "center" }}>
                {emptyMessages[filter] || emptyMessages.All}
              </p>
            </Center>
          )}
        </VStack>

        <Box position="absolute" bottom="4" right="4">
          <Dialog.Trigger asChild>
            <IconButton
              borderRadius="full"
              boxShadow="lg"
              colorPalette="blue"
              size="xl"
              aria-label="add"
            >
              <LuPlus />
            </IconButton>
          </Dialog.Trigger>
        </Box>

        <Dialog.Backdrop />
        <Dialog.Positioner
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
        >
          <Dialog.Content
            bg="gray.700"
            border="1px solid"
            borderColor="gray.600"
            mx="4"
            borderRadius="lg"
            boxShadow="0 10px 30px rgba(0,0,0,0.5)"
          >
            <TaskForm
              onSubmit={(data) => {
                setIsOpen(false);
                addAssignment(data);
              }}
            />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
