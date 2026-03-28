import { Box, Button } from "@chakra-ui/react";
import { useBackend } from "./hooks/useBackend";

export default function Btn() {
  const { executeScript, loading } = useBackend();

  const handleAction = async () => {
    const result = await executeScript({
      user_id: "andrew_01",
      password_key: "my-secure-password",
    });

    if (result) {
      console.log(result.message);
    }
  };

  return (
    <Box pb={2}>
      <Button
        size="xs"
        colorScheme="blue"
        variant="outline"
        loadingText="Scraping"
        onClick={handleAction}
        fontSize="xs"
        borderRadius="md"
        _hover={{ bg: "blue.700", color: "white" }}
      >
        {loading ? "Scraping" : "Scrape"}
      </Button>
    </Box>
  );
}
