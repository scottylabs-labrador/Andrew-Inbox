"use client"

import { ChakraProvider, createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"

const both = (light: string, dark: string) => ({ value: { _light: light, _dark: dark } })

// Tokens from the Andrew Inbox redesign. "brand" is the Carnegie red accent;
// bg / fg / border replace Chakra's grays so every component picks them up.
const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        body: { value: "'Instrument Sans', system-ui, sans-serif" },
        heading: { value: "'Instrument Sans', system-ui, sans-serif" },
        mono: { value: "'JetBrains Mono', ui-monospace, monospace" },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: both("#FAF7F5", "#141212"),
          panel: both("#FFFFFF", "#1C1919"),
          subtle: both("#F3EEEB", "#181515"),
          muted: both("#EFE9E6", "#262120"),
          emphasized: both("#E5DDD9", "#2E2827"),
        },
        fg: {
          DEFAULT: both("#1A1514", "#F4F0EE"),
          muted: both("#6E6461", "#A49C99"),
          subtle: both("#8F8582", "#756D6A"),
        },
        border: {
          DEFAULT: both("#D6CCC8", "#3A3332"),
          muted: both("#E8E1DE", "#2A2524"),
          emphasized: both("#C4B8B3", "#4A4342"),
        },
        brand: {
          solid: both("#9E2A2F", "#9E2A2F"),
          contrast: both("#FFFFFF", "#FFFFFF"),
          fg: both("#9E2A2F", "#EF7A7D"),
          subtle: both("#F6E4E4", "#3A1D1E"),
          muted: both("#EDCFD0", "#4A2425"),
          emphasized: both("#7A1E22", "#B3323A"),
          focusRing: both("#C8373B", "#D9454A"),
          // Unread announcements
          dot: both("#C8373B", "#E5484D"),
        },
        success: {
          fg: both("#1F7A3E", "#7FD49A"),
          subtle: both("#E3F3E8", "#17291D"),
        },
        // Inputs and selects focus in the accent red too
        gray: { focusRing: both("#C8373B", "#D9454A") },
      },
    },
  },
})

const system = createSystem(defaultConfig, config)

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
