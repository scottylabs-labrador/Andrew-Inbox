import { Center, HStack, IconButton, Spinner, VStack } from "@chakra-ui/react";
import { useTasks } from "./ui/useTasks";
import { LuPlus } from "react-icons/lu";
import TaskCard from "./TaskCard";

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

      <IconButton
        position="absolute"
        bottom="4"
        right="4"
        borderRadius="full"
        boxShadow="lg"
        colorPalette="blue"
        size="xl"
        aria-label="add"
      >
        <LuPlus />
      </IconButton>
    </>
  );
}
