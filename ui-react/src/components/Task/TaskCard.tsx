import { Box, Text, HStack, Badge, Flex } from "@chakra-ui/react";
import type { Task } from "../hooks/useTasks";

interface TaskCardProps {
  taskd: Task;
  onToggle: () => void;
}

export default function TaskCard({ taskd, onToggle }: TaskCardProps) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const taskDate = new Date(
    taskd.due.getFullYear(),
    taskd.due.getMonth(),
    taskd.due.getDate(),
  );

  const isOverdue = taskDate < today && !taskd.checked;

  const formattedDate = taskd.due.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Box
      bg="gray.700"
      borderRadius="lg"
      px={4}
      py={3}
      w="100%"
      opacity={taskd.checked ? 0.5 : 1}
      transition="opacity 0.2s"
    >
      <HStack gap={3} align="start" w="100%">
        <Box
          w={4}
          h={4}
          borderRadius="sm"
          border="2px solid"
          borderColor={
            taskd.checked ? "blue.400" : isOverdue ? "red.400" : "gray.400"
          }
          bg={taskd.checked ? "blue.400" : "transparent"}
          cursor="pointer"
          flexShrink={0}
          mt="3px"
          onClick={onToggle}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {taskd.checked && (
            <Text fontSize="9px" color="white" fontWeight="bold">
              ✓
            </Text>
          )}
        </Box>

        <Box flex="1" minW={0}>
          <Flex justify="space-between" align="start" gap={2} mb={0.5}>
            <Text
              color="white"
              fontWeight="medium"
              fontSize="sm"
              textDecoration={taskd.checked ? "line-through" : "none"}
              lineHeight="1.2"
              wordBreak="break-word"
            >
              {taskd.assignment}
            </Text>

            {isOverdue && (
              <Badge
                colorPalette="red"
                variant="solid"
                size="xs"
                flexShrink={0}
                borderRadius="sm"
                px={1}
              >
                OVERDUE
              </Badge>
            )}
          </Flex>
          <Text color={isOverdue ? "red.300" : "gray.400"} fontSize="xs" mb={1}>
            Due {formattedDate}
          </Text>
          <HStack gap={1}>
            <Box w={2} h={2} borderRadius="full" bg="red.400" flexShrink={0} />
            <Text color="gray.400" fontSize="xs" truncate>
              {taskd.course}
            </Text>
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
}
