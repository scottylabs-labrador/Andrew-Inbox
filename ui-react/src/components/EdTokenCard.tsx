import { Box, Button, HStack, Input, Link, Text, VStack } from "@chakra-ui/react";
import { useState, type FormEvent } from "react";
import SettingsCard from "./SettingsCard";
import type { EdTokenControls } from "./hooks/useAuth";

const ED_TOKEN_PAGE = "https://edstem.org/us/settings/api-tokens";

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

// Optional: with an Ed token saved, fetches also pull Ed Discussion announcements
export default function EdTokenCard({ ed, invalid, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showForm = editing || invalid;

  const save = async (value: string | null) => {
    setSaving(true);
    setError(null);
    const err = await ed.save(value);
    setSaving(false);
    if (err) return setError(err);
    setToken("");
    setEditing(false);
    onChanged();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (token.trim().length < 10) return setError("That doesn't look like an Ed token. Copy the whole thing.");
    save(token);
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
            {(!showForm || invalid) && <LinkButton label="Remove" onClick={() => save(null)} />}
          </HStack>
        </HStack>
      ) : (
        !showForm && (
          <HStack justify="space-between" gap={3}>
            <Text fontSize="13px" color="fg.muted">
              Add your Ed token to also get Ed announcements.
            </Text>
            <LinkButton label="Add token" onClick={() => setEditing(true)} />
          </HStack>
        )
      )}

      {invalid && (
        <Text fontSize="13px" lineHeight="1.5" color="red.fg" mb={3}>
          Ed didn't accept your token. It may have expired or been deleted. Make a new one and paste it below.
        </Text>
      )}

      {showForm && (
        <form onSubmit={onSubmit}>
          <VStack gap={2} align="stretch">
            <Text fontSize="13px" lineHeight="1.5" color="fg.muted">
              Open{" "}
              <Link href={ED_TOKEN_PAGE} target="_blank" color="brand.fg" fontWeight="semibold">
                Ed's API token page
              </Link>
              , create a new token, then copy it here.
            </Text>
            <Input
              type="password"
              size="sm"
              placeholder="Paste Ed token here…"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={saving}
            />
            {error && (
              <Text color="red.fg" fontSize="xs">
                {error}
              </Text>
            )}
            <HStack gap={2}>
              <Button type="submit" colorPalette="brand" size="sm" flex={1} loading={saving}>
                Save Ed token
              </Button>
              {!invalid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              )}
            </HStack>
          </VStack>
        </form>
      )}
    </SettingsCard>
  );
}
