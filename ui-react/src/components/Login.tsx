import { Box, Text, VStack, HStack, Input, Button } from "@chakra-ui/react";
import { useState } from "react";
import { FiInfo, FiX } from "react-icons/fi";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "./hooks/useUser";

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  token: z.string().min(3, { message: "Please enter a valid Canvas token." }),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [showPopup, setShowPopup] = useState(false);
  const { registerUser, loading: isSubmitting, error: dbError } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = await registerUser(data.username, data.token);

    if (result.success) {
      onLogin();
    }
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
      <VStack gap={1} mb={10}>
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
        <Text fontSize="xs" color="gray.400">
          Sign in to continue
        </Text>
      </VStack>

      <form style={{ width: "100%" }} onSubmit={handleSubmit(onSubmit)}>
        <VStack gap={5} w="100%" align="stretch">
          {/* DB Error Message */}
          {dbError && (
            <Box
              bg="red.900/40"
              p={2}
              borderRadius="md"
              border="1px solid"
              borderColor="red.500"
            >
              <Text color="red.200" fontSize="xs" textAlign="center">
                {dbError}
              </Text>
            </Box>
          )}

          <Box>
            <Text
              as="span"
              display="block"
              fontSize="xs"
              fontWeight="bold"
              color="gray.400"
              mb={1}
              textTransform="uppercase"
            >
              Username
            </Text>
            <Input
              {...register("username")}
              placeholder="e.g. jdoe"
              bg="gray.900"
              border="none"
              fontSize="sm"
              color="white"
              disabled={isSubmitting}
              _focus={{ ring: "1px", ringColor: "blue.400" }}
            />
            {errors.username && (
              <Text color="red.400" fontSize="xs" mt={1}>
                {errors.username.message}
              </Text>
            )}
          </Box>

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
              placeholder="Paste token here..."
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
            mt={4}
            bg="blue.500"
            color="white"
            loading={isSubmitting}
            _hover={{ bg: "blue.400" }}
            borderRadius="lg"
            size="md"
          >
            Sign In
          </Button>
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
              You'll need to login again only after your expiration date.
              Thanks!
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
