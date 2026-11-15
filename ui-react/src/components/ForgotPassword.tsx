import { Box, Text, VStack, Input, Button } from "@chakra-ui/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { readJson, removeKey, writeJson } from "@/storage";

// After the code is emailed, remember who it went to so closing the popup to
// check your email comes back to the "enter the code" step. Only the Andrew ID
// and time are saved, never the code or passwords. Supabase reset codes last
// an hour, so the step is dropped after that.
export const RESET_STEP_KEY = "andrew-inbox-reset-step";
const CODE_LIFETIME_MS = 60 * 60 * 1000;

interface ResetStep {
  andrewId: string;
  sentAt: number;
}

const savedResetStep = () => {
  const saved = readJson<ResetStep>(RESET_STEP_KEY);
  if (saved && Date.now() - saved.sentAt < CODE_LIFETIME_MS) return saved.andrewId;
  removeKey(RESET_STEP_KEY);
  return null;
};

const saveResetStep = (andrewId: string | null) => {
  if (andrewId) writeJson(RESET_STEP_KEY, { andrewId, sentAt: Date.now() });
  else removeKey(RESET_STEP_KEY);
};

const andrewIdField = z
  .string()
  .trim()
  .min(1, { message: "Andrew ID is required." })
  .regex(/^[a-zA-Z0-9]+$/, {
    message: "Just your Andrew ID, without @andrew.cmu.edu.",
  });

const requestSchema = z.object({ andrewId: andrewIdField });

const resetSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^\d{6,10}$/, { message: "Enter the code from the email." }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." }),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match.",
    path: ["confirm"],
  });

type RequestData = z.infer<typeof requestSchema>;
type ResetData = z.infer<typeof resetSchema>;

interface Props {
  sendPasswordResetCode: (andrewId: string) => Promise<string | null>;
  resetPassword: (
    andrewId: string,
    code: string,
    newPassword: string,
  ) => Promise<string | null>;
  onBack: () => void;
}

const labelProps = {
  as: "span" as const,
  display: "block",
  fontSize: "xs",
  fontWeight: "bold",
  color: "fg.muted",
  mb: 1,
  textTransform: "uppercase" as const,
};

const inputProps = {
  fontSize: "sm",
};

export default function ForgotPassword({
  sendPasswordResetCode,
  resetPassword,
  onBack,
}: Props) {
  // Set once the code has been emailed; switches the form to step 2.
  const [andrewId, setAndrewIdState] = useState<string | null>(savedResetStep);
  const setAndrewId = (id: string | null) => {
    setAndrewIdState(id);
    saveResetStep(id);
  };
  const [message, setMessage] = useState<string | null>(null);

  const requestForm = useForm<RequestData>({
    resolver: zodResolver(requestSchema),
  });
  const resetForm = useForm<ResetData>({ resolver: zodResolver(resetSchema) });

  const onRequest = async (data: RequestData) => {
    setMessage(null);
    const error = await sendPasswordResetCode(data.andrewId);
    if (error) setMessage(error);
    else setAndrewId(data.andrewId.trim().toLowerCase());
  };

  const onReset = async (data: ResetData) => {
    if (!andrewId) return;
    setMessage(null);
    // On success the user is signed in and App moves on to the inbox.
    const error = await resetPassword(andrewId, data.code, data.password);
    if (error) setMessage(error);
  };

  return (
    <VStack gap={5} w="100%" align="stretch">
      {message && (
        <Box
          bg="red.subtle"
          p={2}
          borderRadius="md"
          border="1px solid"
          borderColor="red.muted"
        >
          <Text color="red.fg" fontSize="xs" textAlign="center">
            {message}
          </Text>
        </Box>
      )}

      {!andrewId ? (
        <form
          style={{ width: "100%" }}
          onSubmit={requestForm.handleSubmit(onRequest)}
        >
          <VStack gap={5} w="100%" align="stretch">
            <Text fontSize="xs" color="fg.muted" textAlign="center">
              We'll email a reset code to your @andrew.cmu.edu address.
            </Text>
            <Box>
              <Text {...labelProps}>Andrew ID</Text>
              <Input
                {...requestForm.register("andrewId")}
                {...inputProps}
                placeholder="e.g. jdoe"
                autoComplete="username"
                disabled={requestForm.formState.isSubmitting}
              />
              {requestForm.formState.errors.andrewId && (
                <Text color="red.fg" fontSize="xs" mt={1}>
                  {requestForm.formState.errors.andrewId.message}
                </Text>
              )}
            </Box>
            <Button
              type="submit"
              w="100%"
              colorPalette="brand"
              loading={requestForm.formState.isSubmitting}
              borderRadius="lg"
              size="md"
            >
              Email Me a Code
            </Button>
          </VStack>
        </form>
      ) : (
        <form
          style={{ width: "100%" }}
          onSubmit={resetForm.handleSubmit(onReset)}
        >
          <VStack gap={4} w="100%" align="stretch">
            <Text fontSize="xs" color="fg.muted" textAlign="center">
              Check {andrewId}@andrew.cmu.edu for a code (it can take a minute
              and may land in spam).
            </Text>
            {/* Not shown. Password managers look for the username next to a new
                password; without this one, Chrome treats the Code box as the
                username and fills the Andrew ID into it. */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={andrewId}
              readOnly
              hidden
            />
            <Box>
              <Text {...labelProps}>Code</Text>
              <Input
                {...resetForm.register("code")}
                {...inputProps}
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                disabled={resetForm.formState.isSubmitting}
              />
              {resetForm.formState.errors.code && (
                <Text color="red.fg" fontSize="xs" mt={1}>
                  {resetForm.formState.errors.code.message}
                </Text>
              )}
            </Box>
            <Box>
              <Text {...labelProps}>New Password</Text>
              <Input
                {...resetForm.register("password")}
                {...inputProps}
                type="password"
                placeholder="At least 6 characters"
                autoComplete="new-password"
                disabled={resetForm.formState.isSubmitting}
              />
              {resetForm.formState.errors.password && (
                <Text color="red.fg" fontSize="xs" mt={1}>
                  {resetForm.formState.errors.password.message}
                </Text>
              )}
            </Box>
            <Box>
              <Text {...labelProps}>Confirm New Password</Text>
              <Input
                {...resetForm.register("confirm")}
                {...inputProps}
                type="password"
                autoComplete="new-password"
                disabled={resetForm.formState.isSubmitting}
              />
              {resetForm.formState.errors.confirm && (
                <Text color="red.fg" fontSize="xs" mt={1}>
                  {resetForm.formState.errors.confirm.message}
                </Text>
              )}
            </Box>
            <Button
              type="submit"
              w="100%"
              colorPalette="brand"
              loading={resetForm.formState.isSubmitting}
              borderRadius="lg"
              size="md"
            >
              Reset Password
            </Button>
            <Text
              fontSize="xs"
              color="brand.fg"
              textAlign="center"
              cursor="pointer"
              _hover={{ textDecoration: "underline" }}
              onClick={() => {
                setMessage(null);
                setAndrewId(null);
              }}
            >
              Didn't get it? Send another code
            </Text>
          </VStack>
        </form>
      )}

      <Text
        fontSize="xs"
        color="fg.muted"
        textAlign="center"
        cursor="pointer"
        _hover={{ color: "fg", textDecoration: "underline" }}
        onClick={onBack}
      >
        Back to sign in
      </Text>
    </VStack>
  );
}
