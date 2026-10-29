import { Box, Checkbox, HStack, IconButton, Text } from "@chakra-ui/react";
import { LuPencil } from "react-icons/lu";
import type { Task } from "../hooks/useTasks";
import { isOverdue as isPastDue, startOfDay } from "@/dates";
import { useCourseColor } from "@/courseColors";

interface TaskCardProps {
  taskd: Task;
  onToggle: () => void;
  // Only for tasks you added yourself
  onEdit?: () => void;
  // Under a day heading only the time is shown; elsewhere the date too
  timeOnly?: boolean;
}

export default function TaskCard({ taskd, onToggle, onEdit, timeOnly }: TaskCardProps) {
  const done = taskd.status;
  const isOverdue = isPastDue(taskd.due, done);
  const dueToday = startOfDay(taskd.due).getTime() === startOfDay(new Date()).getTime();
  const dotColor = useCourseColor(taskd.course);

  // e.g. "6:00 PM" or "Oct 28, 11:59 PM", in the user's own timezone
  const formattedDate = taskd.due.toLocaleString("en-US", {
    ...(timeOnly ? {} : { month: "short", day: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  });

  const dueColor = isOverdue ? "red.fg" : dueToday && !done ? "brand.fg" : "fg.muted";

  // The whole card is the checkbox's label, so clicking anywhere ticks it off
  return (
    <Checkbox.Root
      checked={done}
      onCheckedChange={onToggle}
      colorPalette="brand"
      display="flex"
      alignItems="start"
      gap={3}
      w="100%"
      px="14px"
      py={3}
      bg="bg.panel"
      borderWidth="1px"
      borderColor={isOverdue ? "red.muted" : "border.muted"}
      borderRadius="10px"
      cursor="pointer"
      opacity={done ? 0.55 : 1}
      transition="opacity 0.2s, border-color 0.15s"
      _hover={{ borderColor: isOverdue ? "red.emphasized" : "border.emphasized" }}
    >
      <Checkbox.HiddenInput aria-label={`Mark ${taskd.assignment} done`} />
      <Checkbox.Control
        boxSize="18px"
        mt="1px"
        borderRadius="5px"
        borderWidth="1.5px"
        borderColor={done ? "brand.solid" : "border.emphasized"}
      />

      <Box flex="1" minW={0} display="flex" flexDirection="column" gap="6px">
        <HStack justify="space-between" align="start" gap={2}>
          <Text
            fontSize="14.5px"
            fontWeight="semibold"
            lineHeight="1.3"
            textDecoration={done ? "line-through" : "none"}
            wordBreak="break-word"
          >
            {taskd.assignment}
          </Text>
          {onEdit && (
            <IconButton
              aria-label={`Edit ${taskd.assignment}`}
              title="Edit"
              size="2xs"
              variant="ghost"
              color="fg.muted"
              flexShrink={0}
              mt="-2px"
              onClick={(e) => {
                e.preventDefault();
                onEdit();
              }}
            >
              <LuPencil />
            </IconButton>
          )}
        </HStack>

        <HStack gap="10px" fontSize="12.5px" color="fg.muted" minW={0}>
          <HStack gap={1.5} flexShrink={0} fontFamily="mono" fontSize="11.5px" color="fg">
            <Box w="7px" h="7px" borderRadius="full" bg={dotColor} />
            <Text whiteSpace="nowrap" opacity={0.85}>
              {taskd.course}
            </Text>
          </HStack>
          <Text color="border.emphasized">·</Text>
          <Text color={dueColor} truncate>
            {formattedDate}
          </Text>
        </HStack>
      </Box>
    </Checkbox.Root>
  );
}
