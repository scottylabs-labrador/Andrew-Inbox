import { Box, Center, Dialog, HStack, Spinner, VStack } from "@chakra-ui/react";
import { useAnnounce, type Announce } from "../hooks/useAnnounce";
import AnnouncementCard from "./AnnouncementCard";
import AnnoucementOpen from "./AnnouncementOpen";
import { useState } from "react";
import type { Creds } from "@/App";
import { isPostedInWindow } from "@/dates";

interface Props {
  filter: string;
  courseFilter: string | null;
  c: Creds | null;
  refreshKey: number;
}

const emptyMessages: Record<string, string> = {
  All: "No announcements yet!",
  Day: "Nothing posted today!",
  Week: "Nothing in the last 7 days!",
  Month: "Nothing in the last 30 days!",
};

export default function AnnoucementPage({
  filter,
  courseFilter,
  c,
  refreshKey,
}: Props) {
  const { ann, loading, toggleAnnounce } = useAnnounce(refreshKey);
  const [selectedAnn, setSelectedAnn] = useState<Announce | null>(null);

  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleAnnounce(id, currentStatus);
    setSelectedAnn(null);
  };

  if (loading) {
    return (
      <Center h="200px">
        <HStack>
          <p> Loading </p>
          <Spinner color="blue.500" />
        </HStack>
      </Center>
    );
  }

  const filteredAnn = ann.filter(
    (a) =>
      a.user_id === c?.userId &&
      (!courseFilter || a.course === courseFilter) &&
      isPostedInWindow(new Date(a.date), filter),
  );

  const sortedAnn = [...filteredAnn].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <>
      <Dialog.Root
        size="sm"
        placement="center"
        open={!!selectedAnn}
        onOpenChange={(details) => {
          if (!details.open) setSelectedAnn(null);
        }}
      >
        <VStack gap={2}>
          {sortedAnn.length > 0 ? (
            sortedAnn.map((item) => (
              <Box
                key={item.announcement_id}
                w="100%"
                onClick={() => {
                  setSelectedAnn(item);
                  if (!item.is_read) {
                    toggleAnnounce(item.announcement_id, item.is_read);
                  }
                }}
                cursor="pointer"
              >
                <AnnouncementCard ann={item} />
              </Box>
            ))
          ) : (
            <Center py={10} flexDirection="column">
              <p style={{ color: "gray", textAlign: "center" }}>
                {emptyMessages[filter] || emptyMessages.All}
              </p>
            </Center>
          )}
        </VStack>

        <Dialog.Backdrop />
        <Dialog.Positioner
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
        >
          <Dialog.Content
            bg="gray.700"
            border="1px solid"
            borderColor="gray.600"
            mx="4"
            borderRadius="lg"
            boxShadow="0 10px 30px rgba(0,0,0,0.5)"
          >
            {selectedAnn && (
              <AnnoucementOpen
                a={selectedAnn}
                onToggle={() =>
                  handleToggle(selectedAnn.announcement_id, selectedAnn.is_read)
                }
              />
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
