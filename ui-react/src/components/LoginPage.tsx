import { Box, Text, VStack, HStack, Input, Button } from "@chakra-ui/react";
import { useState } from "react";
import { FiInfo, FiX } from "react-icons/fi";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const idInvalid = attempted && studentId.trim() === "";
  const passwordInvalid = attempted && password.trim() === "";
  const tokenInvalid = attempted && token.trim() === "";

  const handleSubmit = () => {
    setAttempted(true);
    if (studentId.trim() && password.trim() && token.trim()) {
      onLogin();
    }
  };

  const allFilled = studentId.trim() && password.trim() && token.trim();

  return (
    <Box
      bg="gray.800" w="360px" h="600px"
      borderRadius="2xl" overflow="hidden"
      display="flex" flexDirection="column"
      alignItems="center" justifyContent="center"
      px={8} position="relative"
    >
      {/* ScottyLabs Logo */}
      <VStack gap={1} mb={8}>
        <Box position="relative" w="48px" h="48px">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="scottyGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#40D2FC"/>
                <stop offset="50%" stopColor="#1F4CE0"/>
                <stop offset="100%" stopColor="#FB1A32"/>
              </linearGradient>
            </defs>
          </svg>
        </Box>
        <Text
          fontSize="xl" fontWeight="bold" letterSpacing="widest"
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

      {/* Form */}
      <VStack gap={3} w="100%">
        {/* Student ID */}
        <Input
          placeholder="Student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          bg="gray.700"
          border="1.5px solid"
          borderColor={idInvalid ? "red.400" : "gray.600"}
          color="white"
          _placeholder={{ color: "gray.500" }}
          _focus={{ borderColor: idInvalid ? "red.400" : "blue.400", outline: "none", boxShadow: "none" }}
          borderRadius="lg"
          size="md"
        />

        {/* Password */}
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          bg="gray.700"
          border="1.5px solid"
          borderColor={passwordInvalid ? "red.400" : "gray.600"}
          color="white"
          _placeholder={{ color: "gray.500" }}
          _focus={{ borderColor: passwordInvalid ? "red.400" : "blue.400", outline: "none", boxShadow: "none" }}
          borderRadius="lg"
          size="md"
        />

        {/* Canvas Token */}
        <Box w="100%" position="relative">
          <Input
            placeholder="Canvas Access Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            bg="gray.700"
            border="1.5px solid"
            borderColor={tokenInvalid ? "red.400" : "gray.600"}
            color="white"
            _placeholder={{ color: "gray.500" }}
            _focus={{ borderColor: tokenInvalid ? "red.400" : "blue.400", outline: "none", boxShadow: "none" }}
            borderRadius="lg"
            size="md"
            pr="40px"
          />
          <Box
            position="absolute" right="10px" top="50%"
            transform="translateY(-50%)"
            cursor="pointer" color="gray.400"
            _hover={{ color: "white" }}
            onClick={() => setShowPopup(true)}
            zIndex={1}
          >
            <FiInfo size={16} />
          </Box>
        </Box>

        {/* Validation message */}
        {attempted && (idInvalid || passwordInvalid || tokenInvalid) && (
          <Text fontSize="xs" color="red.400" alignSelf="flex-start">
            Please fill in all fields.
          </Text>
        )}

        {/* Submit button */}
        <Button
          w="100%" mt={2}
          bg="blue.500"
          color="white"
          _hover={{ bg: "blue.400" }}
          _active={{ bg: "blue.600" }}
          borderRadius="lg"
          onClick={handleSubmit}
        >
          {attempted && !allFilled ? "Try Again" : "Submit"}
        </Button>
      </VStack>

      {/* Canvas Token Popup */}
      {showPopup && (
        <Box
          position="absolute"
          top="50%" left="50%"
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
              How to get your Canvas Token
            </Text>
            <Box cursor="pointer" color="gray.400" _hover={{ color: "white" }} onClick={() => setShowPopup(false)}>
              <FiX size={16} />
            </Box>
          </HStack>
          <Text fontSize="xs" color="gray.300" lineHeight="1.7">
            Find your Canvas Access Token via:{"\n"}
            <Text as="span" color="gray.100">
              Canvas › Account › Settings › Approved Integrations › + New Access Token
            </Text>
          </Text>
          <Text fontSize="xs" color="gray.300" lineHeight="1.7" mt={2}>
            Enter a Purpose (<Text as="span" color="gray.100">'Andrew Inbox'</Text>), Expiration Date, and Expiration Time.
          </Text>
          <Text fontSize="xs" color="gray.300" lineHeight="1.7" mt={2}>
            You'll need to login again only after your expiration date. Thanks!
          </Text>
        </Box>
      )}

      {/* Dimmed backdrop when popup open */}
      {showPopup && (
        <Box
          position="absolute" top={0} left={0} right={0} bottom={0}
          bg="blackAlpha.600"
          borderRadius="2xl"
          zIndex={9}
          onClick={() => setShowPopup(false)}
        />
      )}
    </Box>
  );
}