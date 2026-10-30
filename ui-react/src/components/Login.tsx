import { Box, Text, VStack, HStack, Input, Button } from "@chakra-ui/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import ForgotPassword from "./ForgotPassword";

const loginSchema = z.object({
  andrewId: z
    .string()
    .trim()
    .min(1, { message: "Andrew ID is required." })
    .regex(/^[a-zA-Z0-9]+$/, {
      message: "Just your Andrew ID, without @andrew.cmu.edu.",
    }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginPageProps {
  signIn: (andrewId: string, password: string) => Promise<string | null>;
  signUp: (andrewId: string, password: string) => Promise<string | null>;
  sendPasswordResetCode: (andrewId: string) => Promise<string | null>;
  resetPassword: (
    andrewId: string,
    code: string,
    newPassword: string,
  ) => Promise<string | null>;
}

export default function LoginPage({
  signIn,
  signUp,
  sendPasswordResetCode,
  resetPassword,
}: LoginPageProps) {
  const [mode, setMode] = useState<"signIn" | "signUp" | "forgot">("signIn");
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    const action = mode === "signIn" ? signIn : signUp;
    setAuthError(await action(data.andrewId, data.password));
  };

  const switchMode = (next: "signIn" | "signUp") => {
    setAuthError(null);
    setMode(next);
  };

  return (
    <Box
      bg="bg"
      w="400px"
      h="600px"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      px={8}
      position="relative"
    >
      <VStack gap={1} mb={6}>
        <Text
          fontSize="2xl"
          fontWeight="bold"
          letterSpacing="widest"
          style={{
            background: "linear-gradient(90deg, #40D2FC, #1F4CE0, #FB1A32)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Andrew Inbox
        </Text>
        {mode === "forgot" && (
          <Text fontSize="xs" color="fg.muted">
            Reset your password
          </Text>
        )}
      </VStack>

      {mode !== "forgot" && (
        <Box w="100%" mb={6}>
          <HStack
            p="3px"
            gap="3px"
            bg="bg.muted"
            borderRadius="lg"
            role="tablist"
          >
            {(["signUp", "signIn"] as const).map((m) => (
              <Button
                key={m}
                role="tab"
                aria-selected={mode === m}
                flex="1"
                size="sm"
                borderRadius="md"
                variant="plain"
                bg={mode === m ? "bg.panel" : "transparent"}
                color={mode === m ? "fg" : "fg.muted"}
                fontWeight={mode === m ? "semibold" : "medium"}
                shadow={mode === m ? "xs" : "none"}
                onClick={() => switchMode(m)}
              >
                {m === "signUp" ? "I'm new" : "I have an account"}
              </Button>
            ))}
          </HStack>
          <Text fontSize="xs" color="fg.muted" textAlign="center" mt={2}>
            {mode === "signUp"
              ? "First time here? Make an account with your Andrew ID."
              : "Welcome back. Sign in with the password you made."}
          </Text>
        </Box>
      )}

      {mode === "forgot" ? (
        <ForgotPassword
          sendPasswordResetCode={sendPasswordResetCode}
          resetPassword={resetPassword}
          onBack={() => setMode("signIn")}
        />
      ) : (
        <form style={{ width: "100%" }} onSubmit={handleSubmit(onSubmit)}>
          <VStack gap={5} w="100%" align="stretch">
            {authError && (
              <Box
                bg="red.subtle"
                p={2}
                borderRadius="md"
                border="1px solid"
                borderColor="red.muted"
              >
                <Text color="red.fg" fontSize="xs" textAlign="center">
                  {authError}
                </Text>
              </Box>
            )}

            <Box>
              <Text
                as="span"
                display="block"
                fontSize="xs"
                fontWeight="bold"
                color="fg.muted"
                mb={1}
                textTransform="uppercase"
              >
                Andrew ID
              </Text>
              <Input
                {...register("andrewId")}
                placeholder="e.g. jdoe"
                autoComplete="username"
                fontSize="sm"
                disabled={isSubmitting}
              />
              {errors.andrewId && (
                <Text color="red.fg" fontSize="xs" mt={1}>
                  {errors.andrewId.message}
                </Text>
              )}
            </Box>

            <Box>
              <Text
                as="span"
                display="block"
                fontSize="xs"
                fontWeight="bold"
                color="fg.muted"
                mb={1}
                textTransform="uppercase"
              >
                Password
              </Text>
              <Input
                {...register("password")}
                type="password"
                placeholder={
                  mode === "signIn" ? "Your password" : "At least 6 characters"
                }
                autoComplete={
                  mode === "signIn" ? "current-password" : "new-password"
                }
                fontSize="sm"
                disabled={isSubmitting}
              />
              {errors.password && (
                <Text color="red.fg" fontSize="xs" mt={1}>
                  {errors.password.message}
                </Text>
              )}
              {mode === "signIn" && (
                <Text
                  fontSize="xs"
                  color="fg.muted"
                  textAlign="right"
                  mt={1}
                  cursor="pointer"
                  _hover={{ color: "fg", textDecoration: "underline" }}
                  onClick={() => {
                    setAuthError(null);
                    setMode("forgot");
                  }}
                >
                  Forgot password?
                </Text>
              )}
            </Box>

            <Button
              type="submit"
              w="100%"
              mt={4}
              colorPalette="brand"
              loading={isSubmitting}
              borderRadius="lg"
              size="md"
            >
              {mode === "signIn" ? "Sign In" : "Create Account"}
            </Button>
          </VStack>
        </form>
      )}
    </Box>
  );
}
