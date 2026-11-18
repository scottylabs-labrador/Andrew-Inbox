import { Box, HStack, Image, Link, Popover, Portal, Text, VStack } from "@chakra-ui/react";
import { LuChevronDown } from "react-icons/lu";

const SITES = [
  { name: "Canvas", url: "https://canvas.cmu.edu", logo: "site-canvas.png" },
  { name: "Gradescope", url: "https://www.gradescope.com", logo: "site-gradescope.png" },
  { name: "Piazza", url: "https://piazza.com", logo: "site-piazza.png" },
  { name: "Ed", url: "https://edstem.org", logo: "site-ed.png" },
];

// Ed is only listed for people who connected it in Settings
export default function SitesMenu({ showEd }: { showEd: boolean }) {
  const sites = SITES.filter((s) => s.name !== "Ed" || showEd);

  return (
    <Popover.Root positioning={{ placement: "bottom-end" }} initialFocusEl={() => null}>
      <Popover.Trigger asChild>
        <Box
          as="button"
          display="flex"
          alignItems="center"
          gap="2px"
          pt="10px"
          pb="9px"
          mb="-1px"
          px={1.5}
          borderRadius="6px"
          fontSize="14px"
          fontWeight="semibold"
          color="fg.muted"
          cursor="pointer"
          outline="none"
          _hover={{ color: "fg", bg: "bg.muted" }}
          _expanded={{ color: "fg", bg: "bg.muted" }}
          _focus={{ outline: "none", boxShadow: "none" }}
          _focusVisible={{ outline: "none", boxShadow: "none", bg: "bg.muted", color: "fg" }}
        >
          Sites
          <LuChevronDown size={14} />
        </Box>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            w="180px"
            p={1.5}
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border"
            borderRadius="10px"
            _focus={{ outline: "none", boxShadow: "none" }}
          >
            <VStack gap={0.5} align="stretch">
              {sites.map((s) => (
                <Link
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  px={2.5}
                  py={2}
                  borderRadius="7px"
                  color="fg"
                  textDecoration="none"
                  outline="none"
                  _hover={{ bg: "bg.muted", textDecoration: "none" }}
                  _focus={{ outline: "none", boxShadow: "none" }}
                  _focusVisible={{ outline: "none", boxShadow: "none", bg: "bg.muted" }}
                >
                  <HStack gap={2.5}>
                    <Image src={`${import.meta.env.BASE_URL}${s.logo}`} alt="" boxSize="18px" />
                    <Text fontSize="14px" fontWeight="medium">
                      {s.name}
                    </Text>
                  </HStack>
                </Link>
              ))}
            </VStack>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
