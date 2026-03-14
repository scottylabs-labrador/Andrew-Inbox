import { Box, Text, HStack } from "@chakra-ui/react";

interface AnnouncementCardProps {
  title: string;
  course: string;
  courseColor: string;
  preview: string;
  isUnread?: boolean;
}

export default function AnnouncementCard({
  title, course, courseColor, preview, isUnread = false
}: AnnouncementCardProps) {
  return (
    <Box bg="gray.700" borderRadius="lg" px={4} py={3} w="100%">
      <HStack gap={3} align="start">
        <Box pt={2} flexShrink={0}>
          <Box w={2} h={2} borderRadius="full" bg={isUnread ? "blue.400" : "transparent"} />
        </Box>
        <Box
          w={8} h={8} borderRadius="full" bg="gray.500"
          flexShrink={0} overflow="hidden" display="flex"
          alignItems="center" justifyContent="center"
        >
          <Text fontSize="xs" color="white">P</Text>
        </Box>
        <Box flex={1} minW={0}>
          <Text color="white" fontWeight="bold" fontSize="sm">{title}</Text>
          <HStack gap={1} mb={1}>
            <Box w={2} h={2} borderRadius="full" bg={courseColor} />
            <Text color="gray.400" fontSize="xs">{course}</Text>
          </HStack>
          <Text color="gray.300" fontSize="xs" overflow="hidden"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {preview}
          </Text>
        </Box>
      </HStack>
    </Box>
  );
}