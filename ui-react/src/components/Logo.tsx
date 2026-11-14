import { Image } from "@chakra-ui/react";

// The logo sits on a white tile so it reads the same in light and dark mode
export default function Logo({ size }: { size: number }) {
  return (
    <Image
      src={`${import.meta.env.BASE_URL}AndrewInboxLogo128.png`}
      alt=""
      w={`${size}px`}
      h={`${size}px`}
      flexShrink={0}
      bg="white"
      objectFit="contain"
      p={size > 40 ? "4px" : "2px"}
      borderRadius={`${Math.round(size / 4)}px`}
      boxShadow="0 1px 0 rgba(0,0,0,.06)"
    />
  );
}
