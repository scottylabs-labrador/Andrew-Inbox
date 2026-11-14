import "./App.css";
import { Box, Center, Spinner, Text, VStack } from "@chakra-ui/react";
import MainView from "./components/MainView";
import LoginPage from "./components/Login";
import CanvasTokenPage from "./components/CanvasTokenPage";
import EdTokenPage from "./components/EdTokenPage";
import { useState } from "react";
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
    saveEdToken,
  } = useAuth();
  // After Canvas is connected during sign-up, offer the optional Ed step once
  const [offerEd, setOfferEd] = useState(false);
  const ed = { hasToken: profile?.hasEdToken ?? false, save: saveEdToken };

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
        saveCanvasToken={async (token) => {
          // Set first so the inbox never flashes before the Ed step
          setOfferEd(true);
          const error = await saveCanvasToken(token);
          if (error) setOfferEd(false);
          return error;
        }}
        onSignOut={signOut}
      />
    );
  } else if (offerEd && !profile.hasEdToken) {
    page = <EdTokenPage ed={ed} onDone={() => setOfferEd(false)} />;
  } else {
    page = (
      <MainView
        c={{ userId: profile.userId, username: profile.username }}
        saveCanvasToken={saveCanvasToken}
        ed={ed}
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
