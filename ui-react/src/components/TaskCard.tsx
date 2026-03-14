import { Box, Text, HStack } from "@chakra-ui/react";
import type { Task } from "./ui/useTasks";

interface TaskCardProps {
  taskd: Task;
  color: string;
  checked: boolean;
  onToggle: () => void;
}

export default function TaskCard({
  taskd,
  color,
  checked,
  onToggle,
}: TaskCardProps) {
  // const formattedDate = taskd.due.toLocaleDateString("en-US", {
  //   month: "short",
  //   day: "numeric",
  //   year: "numeric",
  // });

  return (
    <Box
      bg="gray.700"
      borderRadius="lg"
      px={4}
      py={3}
      w="100%"
      opacity={checked ? 0.5 : 1}
    >
      <HStack gap={3} align="start">
        <Box
          w={4}
          h={4}
          borderRadius="sm"
          border="2px solid"
          borderColor={checked ? "blue.400" : "gray.400"}
          bg={checked ? "blue.400" : "transparent"}
          cursor="pointer"
          flexShrink={0}
          mt="2px"
          onClick={onToggle}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {checked && (
            <Text fontSize="9px" color="white" lineHeight={1} fontWeight="bold">
              ✓
            </Text>
          )}
        </Box>
        <Box>
          <Text
            color="white"
            fontWeight="medium"
            fontSize="sm"
            textDecoration={checked ? "line-through" : "none"}
          >
            {taskd.assignment}
          </Text>
          <Text color="gray.400" fontSize="xs" mb={0.5}>
            Due (Enter date here) {/*{formattedDate} */}
          </Text>
          <HStack gap={1}>
            <Box w={2} h={2} borderRadius="full" bg={color} />
            <Text color="gray.400" fontSize="xs">
              {taskd.course}
            </Text>
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
}
