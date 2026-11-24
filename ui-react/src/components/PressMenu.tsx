import { Box, Popover, Portal } from "@chakra-ui/react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// Which row the cursor is over while the mouse button is still down.
const HotContext = createContext<string | null>(null);

export function menuKey(act: string, id: string) {
  return `${act}:${id}`;
}

// Press the trigger and the menu opens before you let go, like a Mac menu.
// Releasing over a row runs it. A plain click (release still on the trigger)
// leaves the menu open so the next click can choose.
export default function PressMenu({
  trigger,
  children,
  onActivate,
  closeOnActivate = false,
  width = "220px",
  fullWidth = false,
}: {
  trigger: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
  onActivate: (el: HTMLElement) => void;
  closeOnActivate?: boolean;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hot, setHot] = useState<string | null>(null);

  // Close without leaving focus inside a node Chrome then marks aria-hidden.
  const closeMenu = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && menuRef.current?.contains(active)) {
      active.blur();
    }
    closedAt.current = Date.now();
    setOpen(false);
  };
  const armed = useRef(false);
  const openedAt = useRef(0);
  const closedAt = useRef(0);
  const skipClick = useRef(false);
  const onActivateRef = useRef(onActivate);
  const closeOnActivateRef = useRef(closeOnActivate);
  onActivateRef.current = onActivate;
  closeOnActivateRef.current = closeOnActivate;
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const rowAt = (x: number, y: number) => {
    const node = document.elementFromPoint(x, y) as HTMLElement | null;
    const row = node?.closest("[data-act]") as HTMLElement | null;
    return row && menuRef.current?.contains(row) ? row : null;
  };

  useEffect(() => {
    if (!open) return;
    const move = (e: PointerEvent) => {
      if (!armed.current) return;
      setHot(rowAt(e.clientX, e.clientY)?.dataset.key ?? null);
    };
    const up = (e: PointerEvent) => {
      if (!armed.current) return;
      armed.current = false;
      setHot(null);
      const row = rowAt(e.clientX, e.clientY);
      if (row) {
        // The click that follows this release would run the row a second time.
        skipClick.current = true;
        onActivateRef.current(row);
        if (closeOnActivateRef.current) closeMenu();
        return;
      }
      const node = document.elementFromPoint(e.clientX, e.clientY);
      if (!triggerRef.current?.contains(node)) closeMenu();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [open]);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(details) => {
        // Ignore the click that completes the press which opened the menu.
        if (!details.open && Date.now() - openedAt.current < 400) return;
        if (details.open && Date.now() - closedAt.current < 400) return;
        setOpen(details.open);
      }}
      positioning={{ placement: "bottom-end" }}
      initialFocusEl={() => null}
    >
      <Popover.Trigger asChild>
        <Box
          ref={triggerRef}
          w={fullWidth ? "100%" : undefined}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            if (open) {
              closeMenu();
              return;
            }
            openedAt.current = Date.now();
            armed.current = true;
            setOpen(true);
          }}
        >
          {trigger}
        </Box>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            w={width}
            p={1.5}
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border"
            borderRadius="10px"
            tabIndex={-1}
            _focus={{ outline: "none", boxShadow: "none" }}
          >
            <Box
              ref={menuRef}
              onClick={(e) => {
                const row = (e.target as HTMLElement).closest("[data-act]") as HTMLElement | null;
                if (!row) return;
                if (skipClick.current) {
                  skipClick.current = false;
                  e.preventDefault();
                  return;
                }
              onActivateRef.current(row);
              if (closeOnActivateRef.current) closeMenu();
              }}
            >
              <HotContext.Provider value={hot}>{children}</HotContext.Provider>
            </Box>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

export function useMenuHot(key: string) {
  return useContext(HotContext) === key;
}
