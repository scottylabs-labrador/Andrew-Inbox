import { Box, Button, Dialog, HStack, VStack } from "@chakra-ui/react";
import type { Announce } from "../hooks/useAnnounce";

interface Props {
  a: Announce;
  onToggle: () => void;
}

export default function AnnoucementOpen({ a, onToggle }: Props) {
  const formattedDate = a.date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <Dialog.Header
        bg="gray.700"
        borderTopRadius="lg"
        borderBottom="1px solid"
        borderColor="gray.600"
        py={4}
      >
        <VStack>
          <Dialog.Title
            fontSize="xl"
            fontWeight="bold"
            color="white"
            mt={1}
            textAlign="center"
            width="100%"
          >
            {a.title}
          </Dialog.Title>
          <HStack justify="space-between" align="center" mb={1}>
            <Box
              fontSize="xs"
              color="blue.400"
              fontWeight="bold"
              letterSpacing="wider"
            >
              <p>{a.course.toUpperCase()}</p>
            </Box>
            <Box fontSize="xs" color="gray.400">
              <p>{formattedDate}</p>
            </Box>
          </HStack>
        </VStack>
      </Dialog.Header>
      <Dialog.Body bg="gray.700" py={6}>
        <Box
          color="gray.200"
          fontSize="sm"
          lineHeight="1.6"
          whiteSpace="pre-wrap"
        >
          <p>{a.text}</p>
        </Box>
      </Dialog.Body>
      <Dialog.Footer
        bg="gray.700"
        borderBottomRadius="lg"
        borderTop="1px solid"
        borderColor="gray.600"
        p={3}
      >
        {!a.isUnread && (
          <Button
            bg="blue.600"
            color="white"
            size="sm"
            px={5}
            _hover={{ bg: "blue.700" }}
            onClick={onToggle}
          >
            Mark as Unread
          </Button>
        )}
        <Dialog.ActionTrigger asChild>
          <Button
            variant="ghost"
            color="gray.400"
            _hover={{ bg: "gray.800", color: "white" }}
            size="sm"
          >
            Close
          </Button>
        </Dialog.ActionTrigger>
      </Dialog.Footer>
    </>
  );
}
