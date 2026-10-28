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
import { isDueInWindow, isOverdue } from "@/dates";

interface Props {
  filter: string;
  courseFilter: string | null;
  c: Creds | null;
  refreshKey: number;
}

const emptyMessages: Record<string, string> = {
  All: "No assignments yet! Time to relax?  ☕️",
  Day: "Nothing due today!  🎉",
  Week: "Nothing due in the next 7 days!  🏖️",
  Month: "No deadlines in the next 30 days!  🗓️",
};

export default function TasksPage({
  filter,
  courseFilter,
  c,
  refreshKey,
}: Props) {
  const { todos, loading, addAssignment, toggleAssignment } = useTasks(
    c?.userId,
    refreshKey,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isOverdueOpen, setIsOverdueOpen] = useState(true);
  const [isDoneOpen, setIsDoneOpen] = useState(false);

  // Hides leftovers from past semesters. Spring: Dec 21 - Jun 7,
  // summer: Jun 8 - Aug 24, fall: Aug 25 - Dec 20.
  const getSemesterRange = () => {
    const now = new Date();
    const year = now.getFullYear();

    if (now >= new Date(year, 11, 21) || now < new Date(year, 5, 8)) {
      const startYear = now.getMonth() === 11 ? year : year - 1;
      return {
        start: new Date(startYear, 11, 21),
        end: new Date(startYear + 1, 5, 8),
      };
    }
    if (now < new Date(year, 7, 25)) {
      return { start: new Date(year, 5, 8), end: new Date(year, 7, 25) };
    }
    return { start: new Date(year, 7, 25), end: new Date(year, 11, 21) };
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
  const now = new Date();

  const semesterTodos = todos.filter(
    (task) =>
      task.userId === c?.userId &&
      task.due >= start &&
      task.due < end &&
      (!courseFilter || task.course === courseFilter),
  );

  // Overdue work always shows, whatever the Day/Week/Month filter
  const overdueTasks = semesterTodos
    .filter((t) => isOverdue(t.due, t.status, now))
    .sort((a, b) => a.due.getTime() - b.due.getTime());

  const filteredTodos = semesterTodos.filter(
    (t) => !isOverdue(t.due, t.status, now) && isDueInWindow(t.due, filter, now),
  );

  const byDueDate = (a: { due: Date }, b: { due: Date }) =>
    new Date(a.due).getTime() - new Date(b.due).getTime();

  const upcomingTasks = filteredTodos
    .filter((t) => !t.status)
    .sort(byDueDate);

  // Submitted / checked-off work, tucked away so it doesn't clutter the list
  const doneTasks = filteredTodos.filter((t) => t.status).sort(byDueDate);

  return (
    <>
      <Dialog.Root
        size="sm"
        open={isOpen}
        onOpenChange={(e) => setIsOpen(e.open)}
        placement="center"
      >
        <VStack gap={3} align="stretch" w="100%" p={4} pb={16}>
          {upcomingTasks.length > 0
            ? upcomingTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  taskd={task}
                  onToggle={() => toggleAssignment(task.id)}
                />
              ))
            : null}

          {/* Overdue goes last so what's due next is at the top */}
          {overdueTasks.length > 0 && (
            <Box w="100%" mt={upcomingTasks.length > 0 ? 2 : 0}>
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
                  <VStack gap={3} align="stretch">
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

          {doneTasks.length > 0 && (
            <Box w="100%" mt={2}>
              <HStack
                cursor="pointer"
                onClick={() => setIsDoneOpen(!isDoneOpen)}
                mb={2}
                color="gray.500"
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {isDoneOpen ? <LuChevronDown /> : <LuChevronRight />}
                <Text>Done ({doneTasks.length})</Text>
              </HStack>

              <Collapsible.Root open={isDoneOpen}>
                <Collapsible.Content>
                  <VStack gap={3} align="stretch">
                    {doneTasks.map((task) => (
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
                if (c) addAssignment(data, c.userId);
              }}
            />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
