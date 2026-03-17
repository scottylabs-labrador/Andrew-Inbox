import { Center, HStack, Spinner, VStack } from "@chakra-ui/react";
import { useAnnouce } from "./hooks/useAnnouce";
import AnnouncementCard from "./AnnouncementCard";

export default function AnnoucementPage() {
  const { ann, loading, toggleAssignment } = useAnnouce();

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
