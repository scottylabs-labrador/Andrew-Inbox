import { Box, Text, HStack, Link } from "@chakra-ui/react";
import type { Announce } from "../hooks/useAnnounce";
import { LuExternalLink } from "react-icons/lu";

interface Props {
  ann: Announce;
}

export default function AnnouncementCard({ ann }: Props) {
  const displayDate = new Date(ann.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Box bg="gray.700" borderRadius="lg" px={4} py={3} w="100%">
      <HStack gap={3} align="start">
        <Box pt={2} flexShrink={0}>
          <Box
            w={2}
            h={2}
            borderRadius="full"
            bg={!ann.is_read ? "blue.400" : "transparent"}
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
            {ann.platform ? ann.platform.charAt(0).toUpperCase() : "P"}
          </Text>
        </Box>

        <Box flex={1} minW={0}>
          <HStack justify="space-between" align="baseline">
            <Text color="white" fontWeight="bold" fontSize="sm" lineClamp={1}>
              {ann.title}
            </Text>
            <Text color="gray.500" fontSize="2xs" flexShrink={0}>
              {displayDate}
            </Text>
          </HStack>

          <HStack gap={1} mb={1}>
            <Box w={2} h={2} borderRadius="full" bg="red.400" />
            <Text color="gray.400" fontSize="xs">
              {ann.course}
            </Text>
          </HStack>

          <Text color="gray.300" fontSize="xs" lineHeight="short" lineClamp={2}>
            {ann.description}
          </Text>

          {ann.link && (
            <Link
              href={ann.link}
              target="_blank"
              rel="noopener noreferrer"
              color="blue.400"
              fontSize="2xs"
              display="flex"
              alignItems="center"
              gap={1}
              _hover={{ textDecoration: "underline", color: "blue.300" }}
            >
              View Original <LuExternalLink size={10} />
            </Link>
          )}
        </Box>
      </HStack>
    </Box>
  );
}
