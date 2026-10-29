import { Box, HStack, IconButton, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuChevronLeft, LuSettings } from "react-icons/lu";
import TimeToggle from "./TimeToggle";
import TasksPage from "./Task/TasksPage";
import AnnoucementPage from "./Announcement/AnnoucementPage";
import Btn from "./Btn";
import CourseFilter from "./CourseFilter";
import Logo from "./Logo";
import SettingsPanel from "./SettingsPanel";
import { useCourses } from "./hooks/useCourses";
import { useAnnounce } from "./hooks/useAnnounce";
import { getLastFetch, isFetchDue, useBackend } from "./hooks/useBackend";
import { CourseListContext } from "@/courseColors";
import { ANNOUNCEMENT_DAYS, isPostedInWindow } from "@/dates";
import type { Creds } from "@/App";

type Tab = "todo" | "announcements";

interface Props {
  c: Creds;
  saveCanvasToken: (token: string) => Promise<string | null>;
  onSignOut: () => void;
}

function TabButton({
  active,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <HStack
      as="button"
      gap={1.5}
      pt="10px"
      pb="9px"
      mb="-1px"
      fontSize="14px"
      fontWeight="semibold"
      cursor="pointer"
      color={active ? "fg" : "fg.muted"}
      borderBottomWidth="2px"
      borderColor={active ? "brand.focusRing" : "transparent"}
      _hover={{ color: "fg" }}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
      {!!badge && (
        <Box
          as="span"
          fontSize="11px"
          fontWeight="bold"
          bg="brand.solid"
          color="brand.contrast"
          borderRadius="full"
          px="6px"
          py="1px"
          lineHeight="1.3"
        >
          {badge}
        </Box>
      )}
    </HStack>
  );
}

export default function MainView({ c, saveCanvasToken, onSignOut }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("todo");
  const [showSettings, setShowSettings] = useState(false);
  // Kept when switching tabs
  const [timeFilter, setTimeFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  // Bumped after each successful fetch so pages re-load from Supabase
  const [refreshKey, setRefreshKey] = useState(0);
  const courses = useCourses(c.userId, refreshKey);
  const announcements = useAnnounce(refreshKey);
  const { executeSync, loading, error } = useBackend(c.userId);

  const runFetch = async () => {
    if (await executeSync()) setRefreshKey((k) => k + 1);
  };

  // Fetch by itself when the popup opens if it's been over a week
  useEffect(() => {
    if (!isFetchDue(c.userId)) return;
    // Let the popup draw first; the fetch takes a minute or two
    const timer = setTimeout(async () => {
      if (await executeSync()) setRefreshKey((k) => k + 1);
    }, 0);
    return () => clearTimeout(timer);
  }, [c.userId, executeSync]);

  // Always the last week: Piazza is only scraped 7 days back anyway
  const recentAnn = announcements.ann.filter(
    (a) => a.user_id === c.userId && isPostedInWindow(new Date(a.date), "Week"),
  );
  const shownAnn = recentAnn.filter(
    (a) => !courseFilter || a.course === courseFilter,
  );
  const unread = (list: typeof recentAnn) => list.filter((a) => !a.is_read).length;

  return (
    <CourseListContext.Provider value={courses}>
      <Box bg="bg" color="fg" w="400px" h="600px" display="flex" flexDirection="column">
        {showSettings ? (
          <HStack
            gap={2.5}
            px={4}
            py={3}
            flexShrink={0}
            borderBottomWidth="1px"
            borderColor="border.muted"
          >
            <IconButton
              size="sm"
              variant="ghost"
              color="fg.muted"
              ml={-1.5}
              aria-label="Back"
              title="Back"
              onClick={() => setShowSettings(false)}
            >
              <LuChevronLeft />
            </IconButton>
            <Text flex={1} fontSize="16px" fontWeight="bold">
              Settings
            </Text>
          </HStack>
        ) : (
          <>
            <HStack gap={2.5} px={4} pt={3.5} flexShrink={0}>
              <Logo size={32} />
              <Text flex={1} fontSize="16px" fontWeight="bold" letterSpacing="-0.01em">
                Andrew Inbox
              </Text>
              <Btn loading={loading} error={error} onFetch={runFetch} />
              <IconButton
                size="sm"
                variant="ghost"
                color="fg.muted"
                aria-label="Settings"
                title="Settings"
                onClick={() => setShowSettings(true)}
              >
                <LuSettings />
              </IconButton>
            </HStack>

            <HStack
              gap="22px"
              px={4}
              mt={3}
              flexShrink={0}
              borderBottomWidth="1px"
              borderColor="border.muted"
            >
              <TabButton
                active={activeTab === "todo"}
                label="To-do"
                onClick={() => setActiveTab("todo")}
              />
              <TabButton
                active={activeTab === "announcements"}
                label="Announcements"
                badge={unread(recentAnn)}
                onClick={() => setActiveTab("announcements")}
              />
            </HStack>

            {/* Filters */}
            <HStack px={4} py={3} gap={2} flexShrink={0}>
              {activeTab === "todo" ? (
                <TimeToggle selected={timeFilter} setSelected={setTimeFilter} />
              ) : (
                <Text fontSize="13px" color="fg.muted" flex={1}>
                  Last {ANNOUNCEMENT_DAYS} days
                  {unread(shownAnn) > 0 && (
                    <>
                      {" · "}
                      <Text as="span" color="fg" fontWeight="semibold">
                        {unread(shownAnn)} unread
                      </Text>
                    </>
                  )}
                </Text>
              )}
              <Box w="128px" flexShrink={0}>
                <CourseFilter
                  courses={courses}
                  selected={courseFilter}
                  setSelected={setCourseFilter}
                />
              </Box>
            </HStack>
          </>
        )}

        {/* Content */}
        <Box
          flex={1}
          overflowY="auto"
          px={4}
          pt={showSettings ? 4 : 0}
          pb={4}
          css={{ scrollbarWidth: "thin", scrollbarColor: "var(--chakra-colors-border) transparent" }}
        >
          {showSettings ? (
            <SettingsPanel
              username={c.username}
              lastFetch={getLastFetch(c.userId)}
              fetching={loading}
              fetchError={error}
              onFetch={runFetch}
              saveCanvasToken={saveCanvasToken}
              onSignOut={onSignOut}
            />
          ) : activeTab === "todo" ? (
            <TasksPage
              filter={timeFilter}
              courseFilter={courseFilter}
              courses={courses}
              c={c}
              refreshKey={refreshKey}
            />
          ) : (
            <AnnoucementPage
              ann={shownAnn}
              loading={announcements.loading}
              toggleAnnounce={announcements.toggleAnnounce}
            />
          )}
        </Box>
      </Box>
    </CourseListContext.Provider>
  );
}
