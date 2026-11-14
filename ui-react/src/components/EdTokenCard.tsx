import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import EdTokenForm, { EdTokenHelp } from "./EdTokenForm";
import SettingsCard from "./SettingsCard";
import type { EdTokenControls } from "./hooks/useAuth";

interface Props {
  ed: EdTokenControls;
  // The last fetch said Ed rejected the saved token
  invalid: boolean;
  onChanged: () => void;
}

function LinkButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      variant="plain"
      h="auto"
      p={0}
      color="brand.fg"
      fontSize="13px"
      fontWeight="semibold"
      _hover={{ textDecoration: "underline" }}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

// Optional: with an Ed token saved, fetches also pull Ed Discussion posts
export default function EdTokenCard({ ed, invalid, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const showForm = editing || invalid;

  const done = () => {
    setEditing(false);
    onChanged();
  };

  const remove = async () => {
    if (!(await ed.save(null))) done();
  };

  return (
    <SettingsCard title="Ed Discussion (optional)">
      {ed.hasToken ? (
        <HStack justify="space-between" mb={showForm ? 3 : 0}>
          <HStack
            gap={1.5}
            px="10px"
            py={1}
            borderRadius="full"
            bg={invalid ? "red.subtle" : "success.subtle"}
            color={invalid ? "red.fg" : "success.fg"}
            fontSize="13px"
            fontWeight="semibold"
          >
            <Box w="7px" h="7px" borderRadius="full" bg={invalid ? "red.fg" : "success.fg"} />
            {invalid ? "Token not working" : "Connected"}
          </HStack>
          <HStack gap={3}>
            {!showForm && <LinkButton label="Replace token" onClick={() => setEditing(true)} />}
            {(!showForm || invalid) && <LinkButton label="Remove" onClick={remove} />}
          </HStack>
        </HStack>
      ) : (
        !showForm && (
          <HStack justify="space-between" gap={3}>
            <Text fontSize="13px" color="fg.muted">
              Add your Ed token to also get Ed posts.
            </Text>
            <LinkButton label="Add token" onClick={() => setEditing(true)} />
          </HStack>
        )
      )}

      {showForm && (
        <VStack gap={2} align="stretch">
          {invalid && (
            <Text fontSize="13px" lineHeight="1.5" color="red.fg">
              Ed didn't accept your token. It may have expired or been deleted. Make a new one.
            </Text>
          )}
          <EdTokenHelp />
          <EdTokenForm
            save={ed.save}
            onSaved={done}
            submitLabel="Save Ed token"
            onCancel={invalid ? undefined : () => setEditing(false)}
          />
        </VStack>
      )}
    </SettingsCard>
  );
}
