import { VStack } from "@chakra-ui/react";
import { useAnnouce } from "./hooks/useAnnouce";
import AnnouncementCard from "./AnnouncementCard";

export default function AnnoucementPage() {
  const { ann, loading, toggleAssignment } = useAnnouce();

  return (
    <>
      <VStack gap={2}>
        {ann.map((item) => (
          <AnnouncementCard
            key={item.id}
            ann={item}
            onToggle={() => console.log("replace")}
          />
        ))}
      </VStack>
    </>
  );
}
