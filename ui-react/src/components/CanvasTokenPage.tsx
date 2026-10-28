import { Box, Text, VStack, HStack, Input, Button } from "@chakra-ui/react";
import { useState } from "react";
import { FiInfo, FiX } from "react-icons/fi";
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
  username: string;
  hasToken: boolean;
  saveCanvasToken: (token: string) => Promise<string | null>;
  onDone: () => void;
  onSignOut: () => void;
}

export default function CanvasTokenPage({
  username,
  hasToken,
  saveCanvasToken,
  onDone,
  onSignOut,
}: Props) {
  const [showPopup, setShowPopup] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TokenFormData>({
    resolver: zodResolver(tokenSchema),
  });

  const onSubmit = async (data: TokenFormData) => {
    setSaveError(null);
    const error = await saveCanvasToken(data.token);
    if (error) setSaveError(error);
    else onDone();
  };

  return (
    <Box
      bg="gray.800"
      w="360px"
      h="600px"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      px={8}
      position="relative"
    >
      <VStack gap={1} mb={8}>
        <Text fontSize="lg" fontWeight="bold" color="white">
          {hasToken ? "Update Canvas Token" : "Connect Canvas"}
        </Text>
        <Text fontSize="xs" color="gray.400" textAlign="center">
          Signed in as {username}.{" "}
          {hasToken
            ? "Paste a new token to replace the saved one."
            : "Andrew Inbox needs a Canvas token to fetch your classes."}
        </Text>
      </VStack>

      <form style={{ width: "100%" }} onSubmit={handleSubmit(onSubmit)}>
        <VStack gap={5} w="100%" align="stretch">
          {saveError && (
            <Box
              bg="red.900/40"
              p={2}
              borderRadius="md"
              border="1px solid"
              borderColor="red.500"
            >
              <Text color="red.200" fontSize="xs" textAlign="center">
                {saveError}
              </Text>
            </Box>
          )}

          <Box position="relative">
            <HStack justify="space-between" mb={1}>
              <Text
                as="span"
                fontSize="xs"
                fontWeight="bold"
                color="gray.400"
                textTransform="uppercase"
              >
                Canvas Access Token
              </Text>
              <Box
                cursor="pointer"
                color="blue.400"
                _hover={{ color: "blue.300" }}
                onClick={() => setShowPopup(true)}
              >
                <FiInfo size={14} />
              </Box>
            </HStack>
            <Input
              {...register("token")}
              type="password"
              placeholder="Paste token here..."
              autoComplete="off"
              bg="gray.900"
              border="none"
              fontSize="sm"
              color="white"
              disabled={isSubmitting}
              _focus={{ ring: "1px", ringColor: "blue.400" }}
            />
            {errors.token && (
              <Text color="red.400" fontSize="xs" mt={1}>
                {errors.token.message}
              </Text>
            )}
          </Box>

          <Button
            type="submit"
            w="100%"
            mt={2}
            bg="blue.500"
            color="white"
            loading={isSubmitting}
            _hover={{ bg: "blue.400" }}
            borderRadius="lg"
            size="md"
          >
            Save Token
          </Button>

          <Text fontSize="xs" color="gray.400" textAlign="center">
            {hasToken ? (
              <Text
                as="span"
                color="blue.400"
                cursor="pointer"
                _hover={{ color: "blue.300", textDecoration: "underline" }}
                onClick={onDone}
              >
                Back to inbox
              </Text>
            ) : null}
            {hasToken ? "  ·  " : ""}
            <Text
              as="span"
              color="gray.400"
              cursor="pointer"
              _hover={{ color: "white", textDecoration: "underline" }}
              onClick={onSignOut}
            >
              Sign out
            </Text>
          </Text>
        </VStack>
      </form>

      {showPopup && (
        <>
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            bg="gray.700"
            borderRadius="xl"
            p={5}
            w="300px"
            zIndex={10}
            boxShadow="0 8px 32px rgba(0,0,0,0.6)"
            border="1px solid"
            borderColor="gray.600"
          >
            <HStack justify="space-between" mb={3}>
              <Text fontSize="sm" fontWeight="bold" color="white">
                Token Instructions
              </Text>
              <Box
                cursor="pointer"
                color="gray.400"
                _hover={{ color: "white" }}
                onClick={() => setShowPopup(false)}
              >
                <FiX size={16} />
              </Box>
            </HStack>
            <Text fontSize="xs" color="gray.300" lineHeight="1.7">
              Find your Canvas Access Token via:{"\n"}
              <Text as="span" color="gray.100">
                Canvas › Account › Settings › Approved Integrations › + New
                Access Token
              </Text>
            </Text>
            <Text fontSize="xs" color="gray.300" lineHeight="1.7" mt={2}>
              Enter a Purpose (
              <Text as="span" color="gray.100">
                'Andrew Inbox'
              </Text>
              ), Expiration Date, and Expiration Time.
            </Text>
            <Text fontSize="xs" color="gray.300" lineHeight="1.7" mt={2}>
              When it expires, come back here (gear icon in the inbox) and paste
              a new one. Thanks!
            </Text>
          </Box>
          <Box
            position="absolute"
            inset={0}
            bg="blackAlpha.700"
            zIndex={9}
            onClick={() => setShowPopup(false)}
          />
        </>
      )}
    </Box>
  );
}
