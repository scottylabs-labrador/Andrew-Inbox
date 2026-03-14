import { Button, HStack } from "@chakra-ui/react";
import { useState } from "react";

const options = ["Day", "Week", "Month"];

export default function TimeToggle() {
  const [selected, setSelected] = useState("Day");

  return (
    <HStack gap={0} bg="gray.700" borderRadius="md" p={1}>
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