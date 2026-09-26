import { Box, Button, Dialog, HStack, VStack, Link } from "@chakra-ui/react";
import type { Announce } from "../hooks/useAnnounce";
import { LuExternalLink } from "react-icons/lu";

interface Props {
  a: Announce;
  onToggle: () => void;
}

export default function AnnoucementOpen({ a, onToggle }: Props) {
  const formattedDate = new Date(a.date).toLocaleDateString("en-US", {
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
        py={6}
        px={4}
      >
        <VStack gap={2} w="100%" align="center" textAlign="center">
          <Dialog.Title
            fontSize="lg"
            fontWeight="bold"
            color="white"
            lineClamp={2}
          >
            {a.title}
          </Dialog.Title>

          <HStack gap={3} justify="center">
            <Box
              fontSize="xs"
              color="blue.400"
              fontWeight="bold"
              letterSpacing="wider"
            >
              {a.course.toUpperCase()}
            </Box>
            <Box w="1px" h="12px" bg="gray.600" />
            <Box fontSize="xs" color="gray.500">
              {formattedDate}
            </Box>
          </HStack>
        </VStack>
      </Dialog.Header>

      <Dialog.Body bg="gray.700" py={8} px={6}>
        <Box
          color="gray.200"
          fontSize="sm"
          lineHeight="1.6"
          whiteSpace="pre-wrap"
        >
          {a.description}
        </Box>
      </Dialog.Body>

      <Dialog.Footer
        bg="gray.700"
        borderBottomRadius="lg"
        borderTop="1px solid"
        borderColor="gray.600"
        p={3}
      >
        <HStack w="100%" justify="center" gap={3} wrap="nowrap">
          {a.link && (
            <Link
              href={a.link}
              target="_blank"
              rel="noopener noreferrer"
              _hover={{ textDecoration: "none" }}
              flex="0 0 auto"
            >
              <Button
                variant="outline"
                borderColor="blue.500"
                color="blue.400"
                size="sm"
                fontSize="xs"
                h="32px"
                px={3}
                cursor="pointer"
                _hover={{ bg: "blue.900", borderColor: "blue.400" }}
              >
                Link <LuExternalLink size={12} style={{ marginLeft: "4px" }} />
              </Button>
            </Link>
          )}

          {a.is_read && (
            <Button
              variant="subtle"
              colorPalette="blue"
              size="sm"
              fontSize="xs"
              h="32px"
              px={3}
              flex="1"
              maxWidth="130px"
              onClick={onToggle}
              whiteSpace="nowrap"
            >
              Mark as Unread
            </Button>
          )}

          <Dialog.ActionTrigger asChild>
            <Button
              variant="ghost"
              color="gray.400"
              size="sm"
              fontSize="xs"
              h="32px"
              px={3}
              flex="0 0 auto"
              _hover={{ bg: "gray.800", color: "white" }}
            >
              Close
            </Button>
          </Dialog.ActionTrigger>
        </HStack>
      </Dialog.Footer>
    </>
  );
}
