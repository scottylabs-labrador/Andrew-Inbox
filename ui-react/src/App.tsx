import "./App.css";
import { Box, Center, Spinner } from "@chakra-ui/react";
import { useState } from "react";
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
  const [editingToken, setEditingToken] = useState(false);

  const handleSignOut = async () => {
    setEditingToken(false);
    await signOut();
  };

  let page;
  if (loading) {
    page = (
      <Center w="360px" h="600px" bg="gray.800">
        <Spinner color="blue.500" />
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
  } else if (!profile.hasCanvasToken || editingToken) {
    page = (
      <CanvasTokenPage
        username={profile.username}
        hasToken={profile.hasCanvasToken}
        saveCanvasToken={saveCanvasToken}
        onDone={() => setEditingToken(false)}
        onSignOut={handleSignOut}
      />
    );
  } else {
    page = (
      <MainView
        c={{ userId: profile.userId, username: profile.username }}
        onEditToken={() => setEditingToken(true)}
      />
    );
  }

  return (
    <Box
      overflow="hidden"
      boxShadow="0 8px 32px rgba(0,0,0,0.5)"
      display="inline-block"
      position="relative"
    >
      {page}
    </Box>
  );
}

export default App;
