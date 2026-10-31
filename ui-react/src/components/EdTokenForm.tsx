import { Button, HStack, Input, Link, Text, VStack } from "@chakra-ui/react";
import { useState, type FormEvent } from "react";

export const ED_TOKEN_PAGE = "https://edstem.org/us/settings/api-tokens";

interface Props {
  save: (token: string) => Promise<string | null>;
  onSaved: () => void;
  submitLabel: string;
  onCancel?: () => void;
}

export function EdTokenHelp() {
  return (
    <Text fontSize="13px" lineHeight="1.5" color="fg.muted">
      Go to{" "}
      <Link href={ED_TOKEN_PAGE} target="_blank" color="brand.fg" fontWeight="semibold" wordBreak="break-all">
        edstem.org/us/settings/api-tokens
      </Link>
      , create a new token, and paste it here.
    </Text>
  );
}

// Used in onboarding and in Settings
export default function EdTokenForm({ save, onSaved, submitLabel, onCancel }: Props) {
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (token.trim().length < 10) return setError("That doesn't look like an Ed token. Copy the whole thing.");
    setSaving(true);
    setError(null);
    const err = await save(token);
    setSaving(false);
    if (err) return setError(err);
    setToken("");
    onSaved();
  };

  return (
    <form onSubmit={onSubmit}>
      <VStack gap={2} align="stretch">
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
            {submitLabel}
          </Button>
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </HStack>
      </VStack>
    </form>
  );
}
