import { Box, HStack, Text } from "@chakra-ui/react";
import { useState } from "react";
import TimeToggle from "./TimeToggle";
import TasksPage from "./TasksPage";
import AnnoucementPage from "./AnnoucementPage";

export default function MainView() {
  const [activeTab, setActiveTab] = useState<"todo" | "announcements">("todo");
  const [timeFilter, setTimeFilter] = useState("All");

  const handleTabChange = (tab: "todo" | "announcements") => {
    setActiveTab(tab);
    setTimeFilter("All");
  };

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
              onClick={() => handleTabChange("todo")}
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
              onClick={() => handleTabChange("announcements")}
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
        <TimeToggle selected={timeFilter} setSelected={setTimeFilter} />
      </Box>

      {/* Content */}
      <Box flex={1} overflowY="auto" px={3} py={3} bg="gray.800">
        {activeTab === "todo" ? (
          <TasksPage filter={timeFilter} />
        ) : (
          <AnnoucementPage filter={timeFilter} />
        )}
      </Box>
    </Box>
  );
}
