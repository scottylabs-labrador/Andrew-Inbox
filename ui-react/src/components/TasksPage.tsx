import {
  Box,
  Center,
  Dialog,
  HStack,
  IconButton,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import { useTasks } from "./hooks/useTasks";
import TaskCard from "./TaskCard";
import { LuPlus } from "react-icons/lu";
import TaskForm from "./TaskForm";
import { useState } from "react";

interface Props {
  filter: string;
}

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
    const taskDate = new Date(task.due);

    const diffInMs = taskDate.getTime() - now.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (filter === "Day") {
      return diffInDays >= 0 && diffInDays <= 1;
    }
    if (filter === "Week") {
      return diffInDays >= 0 && diffInDays <= 7;
    }
    if (filter === "Month") {
      return diffInDays >= 0 && diffInDays <= 30;
    }
    return true;
  });

  const sortedTasks = [...filteredTodos].sort(
    (a, b) => a.due.getTime() - b.due.getTime(),
  );

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
            <p color="gray.500">No assignments yet!</p>
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
