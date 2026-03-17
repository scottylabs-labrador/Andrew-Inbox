import { Button, HStack } from "@chakra-ui/react";

interface Props {
  selected: string;
  setSelected: (val: string) => void;
}

const options = ["All", "Day", "Week", "Month"];

export default function TimeToggle({ selected, setSelected }: Props) {
  return (
    <HStack gap={2} bg="gray.700" borderRadius="md" justify="center" p={1}>
      {options.map((opt) => (
        <Button
          key={opt}
          size="sm"
          onClick={() => setSelected(opt)}
          bg={selected === opt ? "blue.500" : "transparent"}
          color="white"
          _hover={{ bg: selected === opt ? "blue.500" : "gray.600" }}
          borderRadius="md"
          px={4}
        >
          {opt}
        </Button>
      ))}
    </HStack>
  );
}
