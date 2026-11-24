import { Box, HStack, Image, Text } from "@chakra-ui/react";
import { LuChevronDown } from "react-icons/lu";
import PressMenu, { menuKey, useMenuHot } from "./PressMenu";

const SITES = [
  { name: "Canvas", url: "https://canvas.cmu.edu", logo: "site-canvas.png" },
  { name: "Gradescope", url: "https://www.gradescope.com", logo: "site-gradescope.png" },
  { name: "Piazza", url: "https://piazza.com", logo: "site-piazza.png" },
  { name: "Ed", url: "https://edstem.org", logo: "site-ed.png" },
];

function SiteRow({ name, url, logo }: { name: string; url: string; logo: string }) {
  const key = menuKey("open", url);
  const hot = useMenuHot(key);
  return (
    <HStack
      data-act="open"
      data-url={url}
      data-key={key}
      gap={2.5}
      px={2.5}
      py={2}
      borderRadius="7px"
      cursor="pointer"
      userSelect="none"
      bg={hot ? "bg.muted" : "transparent"}
      _hover={{ bg: "bg.muted" }}
    >
      <Image src={`${import.meta.env.BASE_URL}${logo}`} alt="" boxSize="18px" />
      <Text fontSize="14px" fontWeight="medium">
        {name}
      </Text>
    </HStack>
  );
}

// Ed is only listed for people who connected it in Settings
export default function SitesMenu({ showEd }: { showEd: boolean }) {
  const sites = SITES.filter((s) => s.name !== "Ed" || showEd);

  return (
    <PressMenu
      width="180px"
      closeOnActivate
      onActivate={(el) => {
        const url = el.dataset.url;
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      }}
      trigger={(
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
          _focus={{ outline: "none", boxShadow: "none" }}
        >
          Sites
          <LuChevronDown size={14} />
        </Box>
      )}
    >
      {sites.map((s) => (
        <SiteRow key={s.name} {...s} />
      ))}
    </PressMenu>
  );
}
