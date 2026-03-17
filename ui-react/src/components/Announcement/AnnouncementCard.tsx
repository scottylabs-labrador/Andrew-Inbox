import { Box, Text, HStack } from "@chakra-ui/react";
import type { Announce } from "../hooks/useAnnounce";

interface Props {
  ann: Announce;
  onToggle: () => void;
}

export default function AnnouncementCard({ ann, onToggle }: Props) {
  return (
    <Box bg="gray.700" borderRadius="lg" px={4} py={3} w="100%">
      <HStack gap={3} align="start">
        <Box pt={2} flexShrink={0}>
          <Box
            w={2}
            h={2}
            borderRadius="full"
            bg={ann.isUnread ? "blue.400" : "transparent"}
          />
        </Box>
        <Box
          w={8}
          h={8}
          borderRadius="full"
          bg="gray.500"
          flexShrink={0}
          overflow="hidden"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="xs" color="white">
            P
          </Text>
        </Box>
        <Box flex={1} minW={0}>
          <Text color="white" fontWeight="bold" fontSize="sm">
            {ann.title}
          </Text>
          <HStack gap={1} mb={1}>
            <Box w={2} h={2} borderRadius="full" bg="red.400" />
            <Text color="gray.400" fontSize="xs">
              {ann.course}
            </Text>
          </HStack>
          <Text
            color="gray.300"
            fontSize="xs"
            overflow="hidden"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {ann.text}
          </Text>
        </Box>
      </HStack>
    </Box>
  );
}
