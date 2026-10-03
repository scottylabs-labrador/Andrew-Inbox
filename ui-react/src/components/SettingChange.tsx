import type { Creds } from "@/App";
import { Box, Code, Text } from "@chakra-ui/react";

interface Props {
  c: Creds | null;
  setC: (c: Creds) => void;
}

export default function SettingChange({ c, setC }: Props) {
  return (
    <Box
      bg="gray.800"
      w="360px"
      h="600px"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <Box
        px={4}
        py={3}
        bg="gray.900"
        borderBottom="1px solid"
        borderColor="gray.700"
      >
        <Text fontSize="sm" fontWeight="bold" color="white">
          Account Details
        </Text>
      </Box>

      <Box flex={1} p={4} display="flex" flexDirection="column" gap={4}>
        <Box
          bg="gray.900"
          p={3}
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.700"
        >
          <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={1}>
            USERNAME
          </Text>
          <Text fontSize="sm" fontWeight="semibold" color="white">
            {c?.username ?? "Not logged in"}
          </Text>
        </Box>

        <Box
          bg="gray.900"
          p={3}
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.700"
          flex={1}
          display="flex"
          flexDirection="column"
        >
          <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={2}>
            Canvas Token
          </Text>
          <Box
            flex={1}
            bg="gray.800"
            p={3}
            borderRadius="md"
            border="1px solid"
            borderColor="gray.700"
            overflowY="auto"
          >
            <Code
              bg="transparent"
              color="green.300"
              fontSize="xs"
              fontFamily="mono"
              whiteSpace="pre-wrap"
              wordBreak="break-all"
            >
              {c?.token ?? "No token available"}
            </Code>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
