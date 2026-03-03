import "./App.css";
import { Box, VStack } from "@chakra-ui/react";
function App() {
  return (
    <>
      <Box
        width="350px"
        height="500px"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        bg="bg.panel"
        position="relative"
        p={4}
      >
        <VStack flex="1" overflowY="auto" p="4" align="stretch"></VStack>
      </Box>
    </>
  );
}
export default App;
