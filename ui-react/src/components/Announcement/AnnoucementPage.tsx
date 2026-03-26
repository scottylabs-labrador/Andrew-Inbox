import { Box, Center, Dialog, HStack, Spinner, VStack } from "@chakra-ui/react";
// import { useAnnounce, type Announce } from "../hooks/useAnnounce";
import AnnouncementCard from "./AnnouncementCard";
import AnnoucementOpen from "./AnnouncementOpen";
import { useState } from "react";
import { useAnnouncef, type Announce } from "../fakedata/useAnnouncef";

interface Props {
  filter: string;
}

const emptyMessages: Record<string, string> = {
  All: "No announcements yet!",
  Day: "Nothing today!",
  Week: "Nothing this week!",
  Month: "Nothing this month!",
};

export default function AnnoucementPage({ filter }: Props) {
  //const { ann, loading, toggleAnnounce } = useAnnounce();
  const { ann, loading, toggleAnnounce } = useAnnouncef();
  const [selectedAnn, setSelectedAnn] = useState<Announce | null>(null);

  const handleToggle = (id: number) => {
    toggleAnnounce(id);
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

  const filteredAnn = ann.filter((a) => {
    if (filter === "All") return true;

    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const annRawDate = new Date(a.date);
    const annDate = new Date(
      annRawDate.getFullYear(),
      annRawDate.getMonth(),
      annRawDate.getDate(),
    );

    if (filter === "Day") {
      return annDate.getTime() === today.getTime();
    }

    if (filter === "Week") {
      const dayOfWeek = today.getDay();
      const diffToMonday =
        today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setDate(diffToMonday);

      return annDate >= monday && annDate <= today;
    }

    if (filter === "Month") {
      return (
        annDate.getMonth() === today.getMonth() &&
        annDate.getFullYear() === today.getFullYear()
      );
    }

    return true;
  });

  const sortedAnn = [...filteredAnn].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
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
                key={item.id}
                w="100%"
                onClick={() => {
                  setSelectedAnn(item);
                  if (item.isUnread) {
                    toggleAnnounce(item.id);
                  }
                }}
                cursor="pointer"
              >
                <AnnouncementCard ann={item} />
              </Box>
            ))
          ) : (
            <Center py={10} flexDirection="column">
              <p
                style={{
                  color: "gray",
                  textAlign: "center",
                }}
              >
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
                onToggle={() => handleToggle(selectedAnn.id)}
              />
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
