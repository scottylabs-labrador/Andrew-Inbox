import { Box, Text, HStack } from "@chakra-ui/react";
import { platformName, type Announce } from "../hooks/useAnnounce";
import { useCourseColor } from "@/courseColors";

interface Props {
  ann: Announce;
}

export default function AnnouncementCard({ ann }: Props) {
  const dotColor = useCourseColor(ann.course);
  const displayDate = new Date(ann.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <HStack
      gap="10px"
      align="start"
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="10px"
      py={3}
      pl={3}
      pr="14px"
      w="100%"
      _hover={{ borderColor: "border.emphasized" }}
      transition="border-color 0.15s"
    >
      {/* Unread dot */}
      <Box w={2} pt="6px" flexShrink={0}>
        {!ann.is_read && <Box w={2} h={2} borderRadius="full" bg="brand.dot" />}
      </Box>

      <Box flex={1} minW={0} display="flex" flexDirection="column" gap="5px">
        <HStack align="baseline" gap="10px">
          <Text flex={1} minW={0} fontSize="14.5px" fontWeight={ann.is_read ? "medium" : "bold"} truncate>
            {ann.title}
          </Text>
          <Text color="fg.subtle" fontSize="12px" flexShrink={0}>
            {displayDate}
          </Text>
        </HStack>

        <HStack gap={1.5} fontSize="11.5px" color="fg.muted">
          <Box w="7px" h="7px" borderRadius="full" bg={dotColor} flexShrink={0} />
          <Text fontFamily="mono" whiteSpace="nowrap">
            {ann.course}
          </Text>
          {ann.platform && <Text>· {platformName(ann.platform)}</Text>}
        </HStack>

        <Text color="fg.muted" fontSize="13px" lineHeight="1.45" lineClamp={2}>
          {ann.description}
        </Text>
      </Box>
    </HStack>
  );
}
