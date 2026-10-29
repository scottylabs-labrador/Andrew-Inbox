import { Box, HStack } from "@chakra-ui/react";

interface Props {
  selected: string;
  setSelected: (val: string) => void;
}

const options = ["All", "Day", "Week", "Month"];

export default function TimeToggle({ selected, setSelected }: Props) {
  return (
    <HStack
      gap={0}
      flex={1}
      p="3px"
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="9px"
    >
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <Box
            as="button"
            key={opt}
            flex={1}
            py="6px"
            borderRadius="6px"
            fontSize="13px"
            fontWeight={active ? "semibold" : "medium"}
            cursor="pointer"
            bg={active ? "brand.solid" : "transparent"}
            color={active ? "brand.contrast" : "fg.muted"}
            _hover={active ? undefined : { color: "fg" }}
            onClick={() => setSelected(opt)}
            aria-pressed={active}
          >
            {opt}
          </Box>
        );
      })}
    </HStack>
  );
}
