import "./App.css";
import { Box } from "@chakra-ui/react";
import { useState } from "react";
import LoginPage from "./components/LoginPage";
import MainView from "./components/MainView";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <Box
      borderRadius="2xl"
      overflow="hidden"
      boxShadow="0 8px 32px rgba(0,0,0,0.5)"
      display="inline-block"
    >
      {loggedIn ? (
        <MainView />
      ) : (
        <LoginPage onLogin={() => setLoggedIn(true)} />
      )}
    </Box>
  );
}

export default App;