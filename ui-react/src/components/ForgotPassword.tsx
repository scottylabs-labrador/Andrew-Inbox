import { Box, Text, VStack, Input, Button } from "@chakra-ui/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
  color: "gray.400",
  mb: 1,
  textTransform: "uppercase" as const,
};

const inputProps = {
  bg: "gray.900",
  border: "none",
  fontSize: "sm",
  color: "white",
  _focus: { ring: "1px", ringColor: "blue.400" },
};

export default function ForgotPassword({
  sendPasswordResetCode,
  resetPassword,
  onBack,
}: Props) {
  // Set once the code has been emailed; switches the form to step 2.
  const [andrewId, setAndrewId] = useState<string | null>(null);
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
          bg="red.900/40"
          p={2}
          borderRadius="md"
          border="1px solid"
          borderColor="red.500"
        >
          <Text color="red.200" fontSize="xs" textAlign="center">
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
            <Text fontSize="xs" color="gray.400" textAlign="center">
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
                <Text color="red.400" fontSize="xs" mt={1}>
                  {requestForm.formState.errors.andrewId.message}
                </Text>
              )}
            </Box>
            <Button
              type="submit"
              w="100%"
              bg="blue.500"
              color="white"
              loading={requestForm.formState.isSubmitting}
              _hover={{ bg: "blue.400" }}
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
            <Text fontSize="xs" color="gray.400" textAlign="center">
              Check {andrewId}@andrew.cmu.edu for a code (it can take a minute
              and may land in spam).
            </Text>
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
                <Text color="red.400" fontSize="xs" mt={1}>
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
                <Text color="red.400" fontSize="xs" mt={1}>
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
                <Text color="red.400" fontSize="xs" mt={1}>
                  {resetForm.formState.errors.confirm.message}
                </Text>
              )}
            </Box>
            <Button
              type="submit"
              w="100%"
              bg="blue.500"
              color="white"
              loading={resetForm.formState.isSubmitting}
              _hover={{ bg: "blue.400" }}
              borderRadius="lg"
              size="md"
            >
              Reset Password
            </Button>
            <Text
              fontSize="xs"
              color="blue.400"
              textAlign="center"
              cursor="pointer"
              _hover={{ color: "blue.300", textDecoration: "underline" }}
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
        color="gray.400"
        textAlign="center"
        cursor="pointer"
        _hover={{ color: "white", textDecoration: "underline" }}
        onClick={onBack}
      >
        Back to sign in
      </Text>
    </VStack>
  );
}
