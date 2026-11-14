import { Box, Button, Dialog, HStack, IconButton, Text, Link } from "@chakra-ui/react";
import { AI_NOTE, platformName, type Announce } from "../hooks/useAnnounce";
import { LuExternalLink, LuX } from "react-icons/lu";
import { useCourseColor } from "@/courseColors";

interface Props {
  a: Announce;
  onMarkUnread: () => void;
}

export default function AnnoucementOpen({ a, onMarkUnread }: Props) {
  const dotColor = useCourseColor(a.course);
  const formattedDate = new Date(a.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <Box px="18px" pt="18px" pb={4} borderBottomWidth="1px" borderColor="border.muted">
        <HStack justify="space-between" mb="10px">
          <HStack gap={2} fontSize="12px" color="fg.muted" minW={0}>
            <HStack
              gap={1.5}
              px={2}
              py="3px"
              borderRadius="full"
              bg="bg.muted"
              color="fg"
              fontFamily="mono"
              flexShrink={0}
            >
              <Box w="7px" h="7px" borderRadius="full" bg={dotColor} />
              {a.course}
            </HStack>
            <Text truncate>
              {a.platform ? `${platformName(a.platform)} · ` : ""}
              {formattedDate}
            </Text>
          </HStack>
          <Dialog.CloseTrigger asChild position="static">
            <IconButton size="xs" variant="ghost" color="fg.muted" aria-label="Close">
              <LuX />
            </IconButton>
          </Dialog.CloseTrigger>
        </HStack>
        <Dialog.Title fontSize="22px" fontWeight="bold" letterSpacing="-0.015em" lineHeight="1.25">
          {a.title}
        </Dialog.Title>
      </Box>

      <Box px="18px" py={4} display="flex" flexDirection="column" gap="14px">
        <Box fontSize="15px" lineHeight="1.55" whiteSpace="pre-wrap" maxH="260px" overflowY="auto">
          {a.description}
        </Box>
        <HStack
          align="start"
          gap={2}
          px={3}
          py="10px"
          bg="bg"
          borderRadius="8px"
          fontSize="12px"
          lineHeight="1.45"
          color="fg.muted"
        >
          <Text fontFamily="mono" fontWeight="bold" fontSize="10.5px" color="fg" pt="1px">
            AI
          </Text>
          <Text>{AI_NOTE}</Text>
        </HStack>
      </Box>

      <HStack px="18px" pb="18px" gap={2}>
        {a.link && (
          <Button
            asChild
            flex={1}
            h={10}
            colorPalette="brand"
            borderRadius="9px"
            fontSize="14px"
            fontWeight="semibold"
            _hover={{ bg: "brand.emphasized" }}
          >
            <Link href={a.link} target="_blank" rel="noopener noreferrer" textDecoration="none">
              Open original <LuExternalLink />
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          flex={a.link ? undefined : 1}
          h={10}
          px={4}
          borderRadius="9px"
          borderColor="border"
          fontSize="14px"
          fontWeight="semibold"
          onClick={onMarkUnread}
        >
          Mark unread
        </Button>
      </HStack>
    </>
  );
}
