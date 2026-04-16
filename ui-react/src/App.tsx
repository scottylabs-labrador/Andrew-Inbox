import "./App.css";
import { Box } from "@chakra-ui/react";
import { useState } from "react";
import MainView from "./components/MainView";
import LoginPage from "./components/Login";

export interface Creds {
  username: string;
  token: string;
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [cred, setCred] = useState<Creds | null>(null);

  return (
    <Box
      overflow="hidden"
      boxShadow="0 8px 32px rgba(0,0,0,0.5)"
      display="inline-block"
      position="relative"
    >
      {loggedIn ? (
        <MainView c={cred} />
      ) : (
        <LoginPage onLogin={() => setLoggedIn(true)} setC={setCred} />
      )}
    </Box>
  );
}

export default App;
