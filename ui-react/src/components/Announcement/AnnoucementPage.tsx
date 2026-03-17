import { Center, HStack, Spinner, VStack } from "@chakra-ui/react";
import { useAnnouce } from "../hooks/useAnnounce";
import AnnouncementCard from "./AnnouncementCard";

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
  const { ann, loading, toggleAnnounce } = useAnnouce();

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

    // 1. Normalize "Today" to Midnight (00:00:00)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 2. Normalize the Announcement date to Midnight
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
      <VStack gap={2}>
        {sortedAnn.length > 0 ? (
          sortedAnn.map((item) => (
            <AnnouncementCard
              key={item.id}
              ann={item}
              onToggle={() => console.log("replace")}
            />
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
    </>
  );
}
