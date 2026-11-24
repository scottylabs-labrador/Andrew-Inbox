import { Box, HStack, Input, Text } from "@chakra-ui/react";
import { useState, type ReactNode } from "react";
import { LuCheck, LuChevronDown } from "react-icons/lu";
import PressMenu, { menuKey, useMenuHot } from "./PressMenu";
import {
  useCourseColor,
  useCourseName,
  useCycleCourseColor,
  useSetCourseName,
} from "@/courseColors";

interface Props {
  courses: string[];
  // Course numbers the user has switched off. A course not listed here is shown.
  hidden: string[];
  setHidden: (courses: string[]) => void;
}

function Row({
  act,
  id,
  children,
  onDoubleClick,
}: {
  act: string;
  id: string;
  children: ReactNode;
  onDoubleClick?: () => void;
}) {
  const key = menuKey(act, id);
  const hot = useMenuHot(key);
  return (
    <HStack
      data-act={act}
      data-code={id}
      data-key={key}
      gap={2.5}
      px={2.5}
      py={2}
      borderRadius="7px"
      cursor="pointer"
      userSelect="none"
      bg={hot ? "bg.muted" : "transparent"}
      _hover={{ bg: "bg.muted" }}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-act='color']")) return;
        onDoubleClick?.();
      }}
    >
      {children}
    </HStack>
  );
}

function CourseRow({
  course,
  checked,
  editing,
  setEditing,
}: {
  course: string;
  checked: boolean;
  editing: boolean;
  setEditing: (course: string | null) => void;
}) {
  const name = useCourseName(course);
  const renamed = name !== course;
  const color = useCourseColor(course);
  const setName = useSetCourseName();
  const [draft, setDraft] = useState(name);

  const save = () => {
    setName(course, draft);
    setEditing(null);
  };

  return (
    <Row
      act="course"
      id={course}
      onDoubleClick={() => {
        setDraft(name);
        setEditing(course);
      }}
    >
      <Box
        as="button"
        data-act="color"
        data-code={course}
        data-key={menuKey("color", course)}
        aria-label={`Change color for ${name}`}
        boxSize="14px"
        borderRadius="full"
        bg={color}
        flexShrink={0}
        cursor="pointer"
        onDoubleClick={(e) => e.stopPropagation()}
      />
      {editing ? (
        <Input
          size="xs"
          autoFocus
          value={draft}
          fontSize="14px"
          h="26px"
          px={1.5}
          onChange={(e) => setDraft(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") setEditing(null);
          }}
        />
      ) : (
        <>
          <Text flex={1} minW={0} fontSize="14px" fontWeight="medium" truncate>
            {name}
          </Text>
          {renamed && (
            <Text fontSize="11px" color="fg.subtle" flexShrink={0}>
              ({course})
            </Text>
          )}
        </>
      )}
      {checked && (
        <Box flexShrink={0} color="fg">
          <LuCheck size={14} />
        </Box>
      )}
    </Row>
  );
}

export default function CourseFilter({ courses, hidden, setHidden }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const cycle = useCycleCourseColor();
  const hiddenNow = hidden.filter((course) => courses.includes(course));
  const selected = courses.filter((course) => !hiddenNow.includes(course));
  const allOn = hiddenNow.length === 0;
  const onlyName = useCourseName(selected.length === 1 ? selected[0] : "");
  const label = allOn
    ? "All classes"
    : selected.length === 0
      ? "No classes"
      : selected.length === 1
        ? onlyName
        : `${selected.length} classes`;

  const toggle = (course: string) => {
    setHidden(
      hiddenNow.includes(course)
        ? hiddenNow.filter((c) => c !== course)
        : [...hiddenNow, course],
    );
  };

  return (
    <PressMenu
      width="260px"
      onActivate={(el) => {
        const course = el.dataset.code ?? "";
        if (el.dataset.act === "color") {
          cycle(course);
          return;
        }
        if (el.dataset.act === "all") {
          setHidden(allOn ? [...courses] : []);
          return;
        }
        if (el.dataset.act === "course" && course) toggle(course);
      }}
      fullWidth
      trigger={(
        <Box
          as="button"
          w="100%"
          h="36px"
          px={2.5}
          display="flex"
          alignItems="center"
          gap={1}
          fontSize="13px"
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.muted"
          borderRadius="9px"
          color="fg"
          cursor="pointer"
          outline="none"
          _focus={{ outline: "none", boxShadow: "none" }}
          aria-label="Filter by class"
        >
          <Text flex={1} minW={0} truncate textAlign="left">
            {label}
          </Text>
          <LuChevronDown size={14} />
        </Box>
      )}
    >
      <Row act="all" id="all">
        <Text flex={1} fontSize="14px" fontWeight="medium">
          All classes
        </Text>
        {allOn && (
          <Box flexShrink={0} color="fg">
            <LuCheck size={14} />
          </Box>
        )}
      </Row>
      {courses.map((course) => (
        <CourseRow
          key={course}
          course={course}
          checked={!hiddenNow.includes(course)}
          editing={editing === course}
          setEditing={setEditing}
        />
      ))}
      <Text fontSize="11px" color="fg.subtle" px={2.5} pt={1.5} pb={1}>
        Double-click a class to rename it.
      </Text>
    </PressMenu>
  );
}
