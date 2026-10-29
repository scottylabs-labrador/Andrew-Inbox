import "./App.css";
import { Box, Center, Spinner, Text, VStack } from "@chakra-ui/react";
import MainView from "./components/MainView";
import LoginPage from "./components/Login";
import CanvasTokenPage from "./components/CanvasTokenPage";
import { useAuth } from "./components/hooks/useAuth";

export interface Creds {
  userId: string;
  username: string;
}

function App() {
  const {
    profile,
    loading,
    recovering,
    signIn,
    signUp,
    sendPasswordResetCode,
    resetPassword,
    signOut,
    saveCanvasToken,
  } = useAuth();

  let page;
  if (loading) {
    page = (
      <Center w="400px" h="600px" bg="bg">
        {navigator.onLine ? (
          <Spinner color="brand.solid" />
        ) : (
          // Supabase can't be reached, so sign-in would spin forever
          <VStack gap={1} px={8} textAlign="center">
            <Text fontWeight="semibold">You're offline</Text>
            <Text fontSize="sm" color="fg.muted">
              Connect to the internet, then reopen Andrew Inbox.
            </Text>
          </VStack>
        )}
      </Center>
    );
  } else if (!profile || recovering) {
    page = (
      <LoginPage
        signIn={signIn}
        signUp={signUp}
        sendPasswordResetCode={sendPasswordResetCode}
        resetPassword={resetPassword}
      />
    );
  } else if (!profile.hasCanvasToken) {
    page = (
      <CanvasTokenPage
        username={profile.username}
        saveCanvasToken={saveCanvasToken}
        onSignOut={signOut}
      />
    );
  } else {
    page = (
      <MainView
        c={{ userId: profile.userId, username: profile.username }}
        saveCanvasToken={saveCanvasToken}
        onSignOut={signOut}
      />
    );
  }

  return (
    <Box overflow="hidden" display="inline-block" position="relative">
      {page}
    </Box>
  );
}

export default App;
