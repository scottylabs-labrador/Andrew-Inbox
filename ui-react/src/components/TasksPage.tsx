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
import AddButton from "./AddButton";

export default function TasksPage() {
  const { todos, loading, toggleAssignment } = useTasks();

  const sortedTasks = [...todos].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;

    const dateA = a.due instanceof Date ? a.due.getTime() : 0;
    const dateB = b.due instanceof Date ? b.due.getTime() : 0;

    return dateA - dateB;
  });

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

  return (
    <>
      <Dialog.Root size="sm" placement="center">
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
            <AddButton />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
