import { Box, Button, Text, VStack } from "@chakra-ui/react";
import EdTokenForm, { EdTokenHelp } from "./EdTokenForm";
import type { EdTokenControls } from "./hooks/useAuth";

interface Props {
  ed: EdTokenControls;
  onDone: () => void;
}

// Optional second onboarding step, right after Canvas. Can be added later in Settings.
export default function EdTokenPage({ ed, onDone }: Props) {
  return (
    <Box bg="bg" w="400px" h="600px" display="flex" flexDirection="column" justifyContent="center" px={8}>
      <VStack gap={1} mb={5} textAlign="center">
        <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
          Optional
        </Text>
        <Text fontSize="lg" fontWeight="bold">
          Use Ed Discussion?
        </Text>
        <Text fontSize="sm" color="fg.muted">
          If any of your classes use Ed, add an Ed token to see their posts here too. Not on Ed? Skip this. You
          can add it later in Settings.
        </Text>
      </VStack>

      <Box bg="bg.subtle" borderWidth="1px" borderColor="border.muted" borderRadius="lg" p={3} mb={5}>
        <EdTokenHelp />
      </Box>

      <EdTokenForm save={ed.save} onSaved={onDone} submitLabel="Save and continue" />

      <Button variant="ghost" size="sm" mt={2} color="fg.muted" onClick={onDone}>
        Skip for now
      </Button>
    </Box>
  );
}
