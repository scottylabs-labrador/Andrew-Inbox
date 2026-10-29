import { Button } from "@chakra-ui/react";
import { LuRefreshCw } from "react-icons/lu";

interface Props {
  loading: boolean;
  error: string | null;
  onFetch: () => void;
}

// "Fetch" because Scotty is a dog. Also runs by itself every 7 days.
export default function Btn({ loading, error, onFetch }: Props) {
  return (
    <Button
      size="sm"
      h={8}
      px={3}
      variant="outline"
      borderRadius="8px"
      bg="bg.panel"
      borderColor={error ? "red.fg" : "border"}
      color={error ? "red.fg" : "fg"}
      fontSize="13px"
      fontWeight="semibold"
      _hover={{ bg: "bg.muted" }}
      onClick={onFetch}
      loading={loading}
      loadingText="Fetching"
      title={error ?? "Get new assignments and announcements"}
    >
      <LuRefreshCw />
      Fetch
    </Button>
  );
}
