import { Box, Center, Dialog, Spinner, Text, VStack } from "@chakra-ui/react";
import type { Announce } from "../hooks/useAnnounce";
import AnnouncementCard from "./AnnouncementCard";
import AnnoucementOpen from "./AnnouncementOpen";
import { useState } from "react";
import { ANNOUNCEMENT_DAYS } from "@/dates";

interface Props {
  // Already narrowed to this user, the last week and the class filter
  ann: Announce[];
  loading: boolean;
  toggleAnnounce: (id: string, currentStatus: boolean) => void;
}

export default function AnnoucementPage({ ann, loading, toggleAnnounce }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedAnn = ann.find((a) => a.announcement_id === selectedId) ?? null;

  if (loading) {
    return (
      <Center h="200px">
        <Spinner color="brand.solid" />
      </Center>
    );
  }

  const sortedAnn = [...ann].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <>
      <VStack gap={2} align="stretch">
        {sortedAnn.length > 0 ? (
          sortedAnn.map((item) => (
            <Box
              as="button"
              textAlign="left"
              key={item.announcement_id}
              w="100%"
              onClick={() => {
                setSelectedId(item.announcement_id);
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
          <Center py={10}>
            <Text color="fg.muted" fontSize="sm" textAlign="center">
              No announcements in the last {ANNOUNCEMENT_DAYS} days!
            </Text>
          </Center>
        )}
      </VStack>

      <Dialog.Root
        size="sm"
        placement="center"
        open={!!selectedAnn}
        onOpenChange={(details) => {
          if (!details.open) setSelectedId(null);
        }}
      >
        <Dialog.Backdrop bg="rgba(10,7,7,.72)" />
        <Dialog.Positioner>
          <Dialog.Content
            // The popup is only 400px wide: leave a 16px gutter each side
            w="calc(100% - 32px)"
            mx="auto"
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border"
            borderRadius="14px"
            boxShadow="0 24px 48px -12px rgba(0,0,0,.6)"
          >
            {selectedAnn && (
              <AnnoucementOpen
                a={selectedAnn}
                onMarkUnread={() => {
                  toggleAnnounce(selectedAnn.announcement_id, true);
                  setSelectedId(null);
                }}
              />
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
