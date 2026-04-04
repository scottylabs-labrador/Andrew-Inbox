import { Box, Button } from "@chakra-ui/react";
import { useBackend } from "./hooks/useBackend";

export default function Btn() {
  const { executeSync, loading } = useBackend();

  const handleAction = async () => {
    const result = await executeSync("andrew_01");

    if (result) {
      console.log(result);
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
