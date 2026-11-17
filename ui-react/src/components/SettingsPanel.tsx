import { Box, Button, HStack, Link, Text, VStack } from "@chakra-ui/react";
import { PRIVACY_POLICY_URL } from "@/config";
import { useState } from "react";
import { useTheme } from "next-themes";
import CanvasTokenForm from "./CanvasTokenForm";
import EdTokenCard from "./EdTokenCard";
import SegmentedToggle from "./SegmentedToggle";
import SettingsCard from "./SettingsCard";
import type { EdTokenControls } from "./hooks/useAuth";
import Logo from "./Logo";
import { AUTO_FETCH_HOURS } from "./hooks/useBackend";
import { timeAgo } from "@/dates";
import manifest from "../../public/manifest.json";

const THEMES = { System: "system", Light: "light", Dark: "dark" } as const;
type ThemeLabel = keyof typeof THEMES;

interface Props {
  username: string;
  lastFetch: Date | null;
  fetching: boolean;
  fetchError: string | null;
  canvasTokenInvalid: boolean;
  onFetch: () => void;
  saveCanvasToken: (token: string) => Promise<string | null>;
  onTokenSaved: () => void;
  ed: EdTokenControls;
  edTokenInvalid: boolean;
  onEdTokenChanged: () => void;
  onSignOut: () => void;
}

export default function SettingsPanel({
  username,
  lastFetch,
  fetching,
  fetchError,
  canvasTokenInvalid,
  onFetch,
  saveCanvasToken,
  onTokenSaved,
  ed,
  edTokenInvalid,
  onEdTokenChanged,
  onSignOut,
}: Props) {
  const [replacing, setReplacing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const { theme, setTheme } = useTheme();
  const themeLabel =
    (Object.keys(THEMES) as ThemeLabel[]).find((label) => THEMES[label] === theme) ?? "System";
  // A broken token opens the form straight away
  const showForm = replacing || canvasTokenInvalid;

  return (
    <VStack gap={3} align="stretch">
      <VStack gap={2} pt={2} pb={3}>
        <Logo size={72} />
        <Text fontSize="13px" color="fg.muted">
          Andrew Inbox · v{manifest.version}
        </Text>
      </VStack>

      <SettingsCard title="Account">
        <HStack gap={3}>
          <Box
            boxSize="38px"
            flexShrink={0}
            borderRadius="full"
            bg="brand.subtle"
            color="brand.fg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontWeight="bold"
            fontSize="14px"
          >
            {username.slice(0, 2).toUpperCase()}
          </Box>
          <Box flex={1} minW={0}>
            <Text fontSize="15px" fontWeight="semibold" truncate>
              {username}
            </Text>
            <Text fontSize="13px" color="fg.muted" truncate>
              {username}@andrew.cmu.edu
            </Text>
          </Box>
          <Button
            variant="outline"
            h="34px"
            px={3}
            borderRadius="8px"
            borderColor="border"
            fontSize="13px"
            fontWeight="semibold"
            flexShrink={0}
            onClick={onSignOut}
          >
            Sign out
          </Button>
        </HStack>
      </SettingsCard>

      <SettingsCard title="Appearance">
        <SegmentedToggle
          options={Object.keys(THEMES)}
          selected={themeLabel}
          setSelected={(label) => setTheme(THEMES[label as ThemeLabel])}
          aria-label="Theme"
        />
      </SettingsCard>

      <SettingsCard title="Canvas">
        <HStack justify="space-between" mb={showForm ? 3 : 0}>
          <HStack
            gap={1.5}
            px="10px"
            py={1}
            borderRadius="full"
            bg={canvasTokenInvalid ? "red.subtle" : "success.subtle"}
            color={canvasTokenInvalid ? "red.fg" : "success.fg"}
            fontSize="13px"
            fontWeight="semibold"
          >
            <Box w="7px" h="7px" borderRadius="full" bg={canvasTokenInvalid ? "red.fg" : "success.fg"} />
            {canvasTokenInvalid ? "Token not working" : justSaved ? "Token updated" : "Connected"}
          </HStack>
          {!showForm && (
            <Button
              variant="plain"
              h="auto"
              p={0}
              color="brand.fg"
              fontSize="13px"
              fontWeight="semibold"
              _hover={{ textDecoration: "underline" }}
              onClick={() => setReplacing(true)}
            >
              Replace token
            </Button>
          )}
        </HStack>
        {canvasTokenInvalid && (
          <Text fontSize="13px" lineHeight="1.5" color="red.fg" mb={3}>
            Canvas didn't accept your token. It may have expired or been deleted. Make a new one and paste it
            below.
          </Text>
        )}
        {showForm && (
          <CanvasTokenForm
            saveCanvasToken={saveCanvasToken}
            submitLabel="Save new token"
            onSaved={() => {
              setReplacing(false);
              setJustSaved(true);
              onTokenSaved();
            }}
          />
        )}
      </SettingsCard>

      <EdTokenCard ed={ed} invalid={edTokenInvalid} onChanged={onEdTokenChanged} />

      <SettingsCard title="Updates">
        <HStack justify="space-between" gap={3}>
          <Text fontSize="15px" fontWeight="semibold">
            Last fetched {lastFetch ? timeAgo(lastFetch) : "never"}
          </Text>
          <Button
            colorPalette="brand"
            h={8}
            px={3}
            borderRadius="8px"
            fontSize="13px"
            fontWeight="semibold"
            flexShrink={0}
            _hover={{ bg: "brand.emphasized" }}
            loading={fetching}
            loadingText="Fetching"
            onClick={onFetch}
          >
            Fetch now
          </Button>
        </HStack>
        {fetchError && !canvasTokenInvalid && (
          <Text fontSize="13px" color="red.fg" mt={2}>
            {fetchError}
          </Text>
        )}
        <Text fontSize="13px" lineHeight="1.5" color="fg.muted" mt="10px">
          Andrew Inbox fetches new assignments when you open it, at most once {AUTO_FETCH_HOURS === 1 ? "an hour" : `every ${AUTO_FETCH_HOURS} hours`}. The backend needs to be
          running.
        </Text>
      </SettingsCard>

      <Text fontSize="12px" color="fg.subtle" textAlign="center" pt={1}>
        <Link
          href={PRIVACY_POLICY_URL}
          target="_blank"
          rel="noopener noreferrer"
          color="fg.subtle"
          textDecoration="underline"
        >
          Privacy Policy
        </Link>
      </Text>
    </VStack>
  );
}
