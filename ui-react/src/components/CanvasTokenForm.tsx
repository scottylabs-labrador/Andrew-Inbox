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
}

// Used both for first-time setup and for replacing the token in Settings
export default function CanvasTokenForm({ saveCanvasToken, onSaved, submitLabel }: Props) {
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
          <Popover.Root positioning={{ placement: "bottom-end" }}>
            <Popover.Trigger asChild>
              <Link as="button" fontSize="xs" color="brand.fg">
                How do I get one?
              </Link>
            </Popover.Trigger>
            <Portal>
              <Popover.Positioner>
                <Popover.Content w="280px">
                  <Popover.Arrow />
                  <Popover.Body fontSize="xs" lineHeight="1.6">
                    <Text>
                      On{" "}
                      <Link href="https://canvas.cmu.edu/profile/settings" target="_blank" color="brand.fg">
                        canvas.cmu.edu
                      </Link>{" "}
                      go to <b>Account › Settings › Approved Integrations › + New Access Token</b>.
                    </Text>
                    <Text mt={2}>
                      Name it "Andrew Inbox", click <b>Generate Token</b>, and copy the long code it shows.
                      When it expires, paste a new one in Settings.
                    </Text>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
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
