import { Box, Button } from "@chakra-ui/react";
import { useBackend } from "./hooks/useBackend";

interface Props {
  onSynced?: () => void;
}

export default function Btn({ onSynced }: Props) {
  const { executeSync, loading, error } = useBackend();

  const handleAction = async () => {
    const result = await executeSync();

    if (result) {
      console.log(result.message);
      onSynced?.();
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
        borderColor={error ? "red.400" : undefined}
        title={error ?? undefined}
        _hover={{ bg: "blue.700", color: "white" }}
      >
        {loading ? "Scraping" : "Scrape"}
      </Button>
    </Box>
  );
}
