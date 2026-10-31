import { Box, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export default function SettingsCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box bg="bg.panel" borderWidth="1px" borderColor="border.muted" borderRadius="12px" p="14px">
      <Text fontSize="11px" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="0.08em" mb={3}>
        {title}
      </Text>
      {children}
    </Box>
  );
}
