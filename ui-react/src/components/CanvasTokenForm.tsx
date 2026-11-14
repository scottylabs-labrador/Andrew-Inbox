import { Box, Button, HStack, Input, Link, Popover, Portal, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const tokenSchema = z.object({
  token: z
    .string()
    .trim()
    // Canvas tokens look like "7752~" followed by a long string of letters and numbers
    .regex(/^\d+~[A-Za-z0-9]{20,}$/, {
      message:
        "That doesn't look like a Canvas token. It should start with numbers and a ~ (e.g. 7752~...).",
    }),
});

type TokenFormData = z.infer<typeof tokenSchema>;

interface Props {
  saveCanvasToken: (token: string) => Promise<string | null>;
  onSaved: () => void;
  submitLabel: string;
  // True when the page already shows CanvasTokenSteps, so the popover isn't needed.
  // Settings leaves it off and gets the steps in a "How do I get one?" popover.
  showSteps?: boolean;
}

const TOKEN_STEPS = [
  <>
    Open{" "}
    <Link href="https://canvas.cmu.edu/profile/settings" target="_blank" color="brand.fg" fontWeight="semibold">
      your Canvas settings
    </Link>{" "}
    (it opens in a new tab).
  </>,
  <>
    Scroll down to <b>Approved Integrations</b> and click <b>+ New Access Token</b>.
  </>,
  <>
    For <b>Purpose</b>, type <b>Andrew Inbox</b>.
  </>,
  <>
    For <b>Expiration date</b>, pick the <b>last day of this semester</b>. (Blank means it never expires.)
  </>,
  <>
    Click <b>Generate Token</b> and copy the whole code. It starts with numbers and a <b>~</b>, and Canvas
    shows it only once.
  </>,
  <>Come back here, paste it in the box, and click the button under it.</>,
];

export function CanvasTokenSteps() {
  return (
    <Box as="ol" fontSize="xs" lineHeight="1.55" color="fg" display="flex" flexDirection="column" gap={1.5}>
      {TOKEN_STEPS.map((step, i) => (
        <HStack as="li" key={i} align="start" gap={2} listStyleType="none">
          <Box
            flexShrink={0}
            boxSize="18px"
            borderRadius="full"
            bg="brand.subtle"
            color="brand.fg"
            fontSize="10px"
            fontWeight="bold"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {i + 1}
          </Box>
          <Text>{step}</Text>
        </HStack>
      ))}
    </Box>
  );
}

// Used both for first-time setup and for replacing the token in Settings
export default function CanvasTokenForm({ saveCanvasToken, onSaved, submitLabel, showSteps }: Props) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TokenFormData>({ resolver: zodResolver(tokenSchema) });

  const onSubmit = async (data: TokenFormData) => {
    setSaveError(null);
    const error = await saveCanvasToken(data.token);
    if (error) {
      setSaveError(error);
    } else {
      reset({ token: "" });
      onSaved();
    }
  };

  return (
    <form style={{ width: "100%" }} onSubmit={handleSubmit(onSubmit)}>
      <VStack gap={2} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
            Canvas access token
          </Text>
          {!showSteps && (
            <Popover.Root positioning={{ placement: "bottom-end" }}>
              <Popover.Trigger asChild>
                <Link as="button" fontSize="xs" color="brand.fg">
                  How do I get one?
                </Link>
              </Popover.Trigger>
              <Portal>
                <Popover.Positioner>
                  <Popover.Content w="300px">
                    <Popover.Arrow />
                    <Popover.Body>
                      <CanvasTokenSteps />
                    </Popover.Body>
                  </Popover.Content>
                </Popover.Positioner>
              </Portal>
            </Popover.Root>
          )}
        </HStack>

        <Input
          {...register("token")}
          type="password"
          size="sm"
          placeholder="Paste token here…"
          autoComplete="off"
          disabled={isSubmitting}
        />
        {errors.token && (
          <Text color="red.fg" fontSize="xs">
            {errors.token.message}
          </Text>
        )}
        {saveError && (
          <Box bg="red.subtle" color="red.fg" fontSize="xs" p={2} borderRadius="md">
            {saveError}
          </Box>
        )}

        <Button type="submit" colorPalette="brand" size="sm" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </VStack>
    </form>
  );
}
