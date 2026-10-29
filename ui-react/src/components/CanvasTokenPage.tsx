import { Box, Button, Text, VStack } from "@chakra-ui/react";
import CanvasTokenForm from "./CanvasTokenForm";

interface Props {
  username: string;
  saveCanvasToken: (token: string) => Promise<string | null>;
  onSignOut: () => void;
}

// First-time setup right after creating an account. Changing the token later
// happens in Settings.
export default function CanvasTokenPage({ username, saveCanvasToken, onSignOut }: Props) {
  return (
    <Box
      bg="bg"
      w="400px"
      h="600px"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      px={8}
    >
      <VStack gap={1} mb={8} textAlign="center">
        <Text fontSize="lg" fontWeight="bold">
          Connect Canvas
        </Text>
        <Text fontSize="sm" color="fg.muted">
          Andrew Inbox needs a Canvas token to find your classes.
        </Text>
      </VStack>

      <CanvasTokenForm
        saveCanvasToken={saveCanvasToken}
        onSaved={() => {}}
        submitLabel="Save and continue"
      />

      <Text fontSize="xs" color="fg.muted" textAlign="center" mt={6}>
        Signed in as {username}.{" "}
        <Button variant="plain" size="xs" h="auto" p={0} color="fg.muted" textDecoration="underline" onClick={onSignOut}>
          Sign out
        </Button>
      </Text>
    </Box>
  );
}
