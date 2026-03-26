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

  const filteredTodos = todos.filter((task) => {
    if (filter === "All") return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(
      task.due.getFullYear(),
      task.due.getMonth(),
      task.due.getDate(),
    );

    if (taskDate < today && !task.checked) {
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
    if (a.checked !== b.checked) {
      return a.checked ? 1 : -1;
    }

    return a.due.getTime() - b.due.getTime();
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
              <p
                style={{
                  color: "gray",
                  textAlign: "center",
                }}
              >
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
