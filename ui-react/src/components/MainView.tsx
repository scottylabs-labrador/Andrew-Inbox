import { Box, HStack, IconButton, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { RxHamburgerMenu } from "react-icons/rx";
import TimeToggle from "./TimeToggle";
import TaskCard from "./TaskCard";
import AnnouncementCard from "./AnnouncementCard";
import { LuPlus } from "react-icons/lu";

interface Task {
  id: number;
  title: string;
  subtitle: string;
  color: string;
  dueDate: Date;
  checked: boolean;
}

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Homework 4 due",
    subtitle: "15-112",
    color: "red.400",
    dueDate: new Date("2026-03-18"),
    checked: false,
  },
  {
    id: 2,
    title: "Lab report writeup",
    subtitle: "09-105",
    color: "purple.400",
    dueDate: new Date("2026-03-15"),
    checked: false,
  },
  {
    id: 3,
    title: "Reading response",
    subtitle: "76-101",
    color: "yellow.400",
    dueDate: new Date("2026-03-20"),
    checked: false,
  },
  {
    id: 4,
    title: "Problem set 3",
    subtitle: "21-241",
    color: "green.400",
    dueDate: new Date("2026-03-14"),
    checked: false,
  },
  {
    id: 5,
    title: "Project milestone",
    subtitle: "17-214",
    color: "green.400",
    dueDate: new Date("2026-03-22"),
    checked: false,
  },
];

const fakeAnnouncements = [
  {
    title: "Monday's class (1/26) will be online",
    course: "Course Name",
    courseColor: "green.400",
    preview:
      "Hi everyone ❄️ Due to the winter storm and campus updates (see CMU Alert for details...",
    isUnread: true,
  },
  {
    title: "Another Announcement",
    course: "Course Name",
    courseColor: "blue.400",
    preview:
      "This is another announcement made by our glorious president Andrew Carnegie...",
    isUnread: true,
  },
  {
    title: "Monday's class (1/26) will be online",
    course: "Course Name",
    courseColor: "red.400",
    preview:
      "Hi everyone ❄️ Due to the winter storm and campus updates (see CMU Alert for details...",
    isUnread: false,
  },
  {
    title: "Monday's class (1/26) will be online",
    course: "Course Name",
    courseColor: "red.400",
    preview:
      "Hi everyone ❄️ Due to the winter storm and campus updates (see CMU Alert for details...",
    isUnread: false,
  },
];

export default function MainView() {
  const [activeTab, setActiveTab] = useState<"todo" | "announcements">("todo");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t)),
    );
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  return (
    <Box
      bg="gray.800"
      w="360px"
      h="600px"
      borderRadius="16x9"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {/* Tab header */}
      <Box px={3} pt={3} bg="gray.900">
        <HStack gap={0} align="end" justify="space-between">
          <HStack gap={0} align="end">
            {/* To-do tab */}
            <Box
              cursor="pointer"
              px={4}
              py={2}
              bg={activeTab === "todo" ? "gray.800" : "gray.900"}
              borderTopRadius="lg"
              borderBottom={activeTab === "todo" ? "none" : "1px solid"}
              borderBottomColor="gray.700"
              onClick={() => setActiveTab("todo")}
              position="relative"
              zIndex={activeTab === "todo" ? 1 : 0}
            >
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color={activeTab === "todo" ? "white" : "gray.500"}
              >
                🗒 To-do
              </Text>
            </Box>
            {/* Announcements tab */}
            <Box
              cursor="pointer"
              px={4}
              py={2}
              bg={activeTab === "announcements" ? "gray.800" : "gray.900"}
              borderTopRadius="lg"
              borderBottom={
                activeTab === "announcements" ? "none" : "1px solid"
              }
              borderBottomColor="gray.700"
              onClick={() => setActiveTab("announcements")}
              position="relative"
              zIndex={activeTab === "announcements" ? 1 : 0}
            >
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color={activeTab === "announcements" ? "white" : "gray.500"}
              >
                📢 Announcements
              </Text>
            </Box>
          </HStack>
          <Box as={RxHamburgerMenu} color="gray.400" cursor="pointer" mb={2} />
        </HStack>
      </Box>

      {/* Time toggle bar */}
      <Box
        px={4}
        py={3}
        bg="gray.800"
        borderBottom="1px solid"
        borderColor="gray.700"
      >
        <TimeToggle />
      </Box>

      {/* Content */}
      <Box flex={1} overflowY="auto" px={3} py={3} bg="gray.800">
        {activeTab === "todo" ? (
          <VStack gap={2}>
            {sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                {...task}
                onToggle={() => toggleTask(task.id)}
              />
            ))}
          </VStack>
        ) : (
          <VStack gap={2}>
            {fakeAnnouncements.map((a, i) => (
              <AnnouncementCard key={i} {...a} />
            ))}
          </VStack>
        )}
      </Box>

      <IconButton
        position="absolute"
        bottom="4"
        right="4"
        borderRadius="full"
        boxShadow="md"
        colorPalette="blue"
        size="xl"
      >
        <LuPlus />
      </IconButton>
    </Box>
  );
}
