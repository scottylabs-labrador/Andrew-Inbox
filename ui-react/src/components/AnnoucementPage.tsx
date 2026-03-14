import { VStack } from "@chakra-ui/react";
import AnnouncementCard from "./AnnouncementCard";

const fakeAnnouncements = [
  {
    title: "Monday's class (1/26) will be online",
    course: "Course Name",
    courseColor: "green.400",
    preview:
      "Hi everyone ❄️ Due to the winter storm and campus updates (see CMU Alert for details...",
    isUnread: true,
  },
  {
    title: "Another Announcement",
    course: "Course Name",
    courseColor: "blue.400",
    preview:
      "This is another announcement made by our glorious president Andrew Carnegie...",
    isUnread: true,
  },
  {
    title: "Monday's class (1/26) will be online",
    course: "Course Name",
    courseColor: "red.400",
    preview:
      "Hi everyone ❄️ Due to the winter storm and campus updates (see CMU Alert for details...",
    isUnread: false,
  },
  {
    title: "Monday's class (1/26) will be online",
    course: "Course Name",
    courseColor: "red.400",
    preview:
      "Hi everyone ❄️ Due to the winter storm and campus updates (see CMU Alert for details...",
    isUnread: false,
  },
];

export default function AnnoucementPage() {
  return (
    <>
      <VStack gap={2}>
        {fakeAnnouncements.map((a, i) => (
          <AnnouncementCard key={i} {...a} />
        ))}
      </VStack>
    </>
  );
}
