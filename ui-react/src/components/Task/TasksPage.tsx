import {
  Box,
  Center,
  Dialog,
  HStack,
  IconButton,
  Spinner,
  VStack,
  Collapsible,
  Text,
} from "@chakra-ui/react";
import { useTasks } from "../hooks/useTasks";
import TaskCard from "./TaskCard";
import { LuPlus, LuChevronDown, LuChevronRight } from "react-icons/lu";
import TaskForm from "./TaskForm";
import { useState } from "react";
import type { Creds } from "@/App";

interface Props {
  filter: string;
  c: Creds | null;
}

const emptyMessages: Record<string, string> = {
  All: "No assignments yet! Time to relax?  ☕️",
  Day: "Nothing due today!  🎉",
  Week: "The rest of the week looks clear!  🏖️",
  Month: "No deadlines in this month!  🗓️",
};

export default function TasksPage({ filter, c }: Props) {
  const { todos, loading, addAssignment, toggleAssignment } = useTasks(
    c?.username,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isOverdueOpen, setIsOverdueOpen] = useState(true);

  const getSemesterRange = () => {
    const now = new Date();
    const year = now.getFullYear();

    if (now >= new Date(year, 11, 21) || now <= new Date(year, 5, 7)) {
      const startYear = now.getMonth() === 11 ? year : year - 1;
      const endYear = now.getMonth() === 11 ? year + 1 : year;
      return {
        start: new Date(startYear, 11, 21),
        end: new Date(endYear, 5, 7),
      };
    }
    if (now >= new Date(year, 7, 25) && now <= new Date(year, 11, 20)) {
      return { start: new Date(year, 7, 25), end: new Date(year, 11, 20) };
    }
    return { start: new Date(year, 5, 8), end: new Date(year, 5, 24) };
  };

  if (loading) {
    return (
      <Center h="200px">
        <HStack>
          <Text> Loading </Text>
          <Spinner color="blue.500" />
        </HStack>
      </Center>
    );
  }

  const { start, end } = getSemesterRange();
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const filteredTodos = todos.filter((task) => {
    if (task.userId !== c?.username) return false;

    const taskDate = new Date(task.due);
    taskDate.setHours(0, 0, 0, 0);

    const semesterStart = new Date(start);
    semesterStart.setHours(0, 0, 0, 0);
    const semesterEnd = new Date(end);
    semesterEnd.setHours(0, 0, 0, 0);

    if (taskDate < semesterStart || taskDate > semesterEnd) return false;

    const isOverdue = taskDate < todayDate && !task.status;
    if (isOverdue) return true;

    if (filter === "All") return true;

    if (filter === "Day") {
      return taskDate.getTime() === todayDate.getTime();
    }

    if (filter === "Week") {
      const nextSunday = new Date(todayDate);
      nextSunday.setDate(todayDate.getDate() + (6 - todayDate.getDay()));
      return taskDate >= todayDate && taskDate <= nextSunday;
    }

    if (filter === "Month") {
      return (
        taskDate.getMonth() === todayDate.getMonth() &&
        taskDate.getFullYear() === todayDate.getFullYear() &&
        taskDate >= todayDate
      );
    }

    return false;
  });

  const overdueTasks = filteredTodos
    .filter((t) => {
      const d = new Date(t.due);
      const taskDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return taskDate < todayDate && !t.status;
    })
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());

  const upcomingTasks = filteredTodos
    .filter((t) => !overdueTasks.some((ot) => ot.id === t.id))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status ? 1 : -1;
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
          {overdueTasks.length > 0 && (
            <Box w="100%">
              <HStack
                cursor="pointer"
                onClick={() => setIsOverdueOpen(!isOverdueOpen)}
                mb={2}
                color="red.400"
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {isOverdueOpen ? <LuChevronDown /> : <LuChevronRight />}
                <Text>Overdue ({overdueTasks.length})</Text>
              </HStack>

              <Collapsible.Root open={isOverdueOpen}>
                <Collapsible.Content>
                  <VStack gap={3} align="stretch" mb={4}>
                    {overdueTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        taskd={task}
                        onToggle={() => toggleAssignment(task.id)}
                      />
                    ))}
                  </VStack>
                </Collapsible.Content>
              </Collapsible.Root>
            </Box>
          )}

          {upcomingTasks.length > 0
            ? upcomingTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  taskd={task}
                  onToggle={() => toggleAssignment(task.id)}
                />
              ))
            : null}

          {upcomingTasks.length === 0 && overdueTasks.length === 0 && (
            <Center py={10} flexDirection="column">
              <Text color="gray.500" textAlign="center">
                {emptyMessages[filter] || emptyMessages.All}
              </Text>
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
                addAssignment(data, c?.username || "unnamed");
              }}
            />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
