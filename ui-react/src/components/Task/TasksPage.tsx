import {
  Box,
  Center,
  Dialog,
  HStack,
  IconButton,
  Spinner,
  VStack,
  Collapsible,
  Text,
} from "@chakra-ui/react";
import { useTasks, endOfDayIso, type Task } from "../hooks/useTasks";
import TaskCard from "./TaskCard";
import { LuPlus, LuChevronDown, LuChevronRight } from "react-icons/lu";
import TaskForm, { type TaskFormData } from "./TaskForm";
import { useState, type ReactNode } from "react";
import type { Creds } from "@/App";
import { getSemesterRange, isDueInWindow, isOverdue, startOfDay } from "@/dates";

interface Props {
  filter: string;
  courseFilter: string | null;
  courses: string[];
  c: Creds | null;
  refreshKey: number;
}

const emptyMessages: Record<string, string> = {
  All: "No assignments yet! Time to relax?  ☕️",
  Day: "Nothing due today!  🎉",
  Week: "Nothing due in the next 7 days!  🏖️",
  Month: "No deadlines in the next 30 days!  🗓️",
};

const pad = (n: number) => String(n).padStart(2, "0");
const toDay = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// "Today · Oct 29", "Tomorrow · Oct 30", "Sat · Nov 1"
function dayLabel(day: Date, now: Date) {
  const date = day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const diff = Math.round((day.getTime() - startOfDay(now).getTime()) / 864e5);
  if (diff === 0) return `Today · ${date}`;
  if (diff === 1) return `Tomorrow · ${date}`;
  return `${day.toLocaleDateString("en-US", { weekday: "short" })} · ${date}`;
}

function GroupHeader({
  title,
  count,
  color = "fg.muted",
  open,
  setOpen,
}: {
  title: string;
  count: number;
  color?: string;
  // Only Overdue and Done fold up
  open?: boolean;
  setOpen?: (open: boolean) => void;
}) {
  const foldable = !!setOpen;
  return (
    <HStack
      as={foldable ? "button" : "div"}
      justify="space-between"
      w="100%"
      pt={2}
      px="2px"
      cursor={foldable ? "pointer" : undefined}
      onClick={foldable ? () => setOpen(!open) : undefined}
      aria-expanded={foldable ? open : undefined}
      fontSize="11px"
      fontWeight="semibold"
      letterSpacing="0.08em"
      textTransform="uppercase"
      color={color}
    >
      <HStack gap={1}>
        {foldable && (open ? <LuChevronDown /> : <LuChevronRight />)}
        <Text>{title}</Text>
      </HStack>
      <Text fontFamily="mono" letterSpacing={0} color="fg.subtle">
        {count}
      </Text>
    </HStack>
  );
}

function Section({
  title,
  count,
  color,
  open,
  setOpen,
  children,
}: {
  title: string;
  count: number;
  color: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Box w="100%">
      <GroupHeader title={title} count={count} color={color} open={open} setOpen={setOpen} />
      <Collapsible.Root open={open}>
        <Collapsible.Content>
          <VStack gap={2} align="stretch" pt={2}>
            {children}
          </VStack>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
}

export default function TasksPage({
  filter,
  courseFilter,
  courses,
  c,
  refreshKey,
}: Props) {
  const {
    todos,
    loading,
    addAssignment,
    toggleAssignment,
    updateAssignment,
    deleteAssignment,
  } = useTasks(c?.userId, refreshKey);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [isOverdueOpen, setIsOverdueOpen] = useState(true);
  const [isDoneOpen, setIsDoneOpen] = useState(false);

  if (loading) {
    return (
      <Center h="200px">
        <Spinner color="brand.solid" />
      </Center>
    );
  }

  const { start, end } = getSemesterRange();
  const now = new Date();

  const semesterTodos = todos.filter(
    (task) =>
      task.userId === c?.userId &&
      task.due >= start &&
      task.due < end &&
      (!courseFilter || task.course === courseFilter),
  );

  const byDueDate = (a: Task, b: Task) => a.due.getTime() - b.due.getTime();

  // Overdue work always shows, whatever the Day/Week/Month filter
  const overdueTasks = semesterTodos
    .filter((t) => isOverdue(t.due, t.status, now))
    .sort(byDueDate);

  const filteredTodos = semesterTodos.filter(
    (t) => !isOverdue(t.due, t.status, now) && isDueInWindow(t.due, filter, now),
  );

  const upcomingTasks = filteredTodos.filter((t) => !t.status).sort(byDueDate);

  // Submitted / checked-off work, most recent first
  const doneTasks = filteredTodos
    .filter((t) => t.status)
    .sort((a, b) => byDueDate(b, a));

  // Upcoming work grouped under one heading per day, in order
  const days = new Map<number, Task[]>();
  for (const task of upcomingTasks) {
    const day = startOfDay(task.due).getTime();
    days.set(day, [...(days.get(day) ?? []), task]);
  }

  const card = (task: Task, timeOnly = false) => (
    <TaskCard
      key={task.id}
      taskd={task}
      timeOnly={timeOnly}
      onToggle={() => toggleAssignment(task.id)}
      onEdit={task.platform === "manual" ? () => setEditing(task) : undefined}
    />
  );

  const dialog = (
    open: boolean,
    onOpenChange: (open: boolean) => void,
    content: ReactNode,
  ) => (
    <Dialog.Root
      size="sm"
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="center"
    >
      <Dialog.Backdrop bg="rgba(10,7,7,.72)" />
      <Dialog.Positioner>
        <Dialog.Content
          // The popup is only 400px wide: leave a 16px gutter each side
          w="calc(100% - 32px)"
          mx="auto"
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border"
          borderRadius="14px"
          boxShadow="0 24px 48px -12px rgba(0,0,0,.6)"
        >
          {content}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );

  return (
    <>
      {/* pb leaves room so the floating + button doesn't cover the last card */}
      <VStack gap={2} align="stretch" w="100%" pb="72px">
        {[...days].map(([day, tasks]) => (
          <VStack key={day} gap={2} align="stretch">
            <GroupHeader title={dayLabel(new Date(day), now)} count={tasks.length} />
            {tasks.map((t) => card(t, true))}
          </VStack>
        ))}

        {/* Overdue and done go last so what's due next is at the top */}
        {overdueTasks.length > 0 && (
          <Section
            title="Overdue"
            count={overdueTasks.length}
            color="red.fg"
            open={isOverdueOpen}
            setOpen={setIsOverdueOpen}
          >
            {overdueTasks.map((t) => card(t))}
          </Section>
        )}

        {doneTasks.length > 0 && (
          <Section
            title="Done"
            count={doneTasks.length}
            color="fg.muted"
            open={isDoneOpen}
            setOpen={setIsDoneOpen}
          >
            {doneTasks.map((t) => card(t))}
          </Section>
        )}

        {upcomingTasks.length === 0 && overdueTasks.length === 0 && (
          <Center py={10}>
            <Text color="fg.muted" textAlign="center" fontSize="sm">
              {emptyMessages[filter] || emptyMessages.All}
            </Text>
          </Center>
        )}
      </VStack>

      <Box position="absolute" bottom="4" right="4">
        <IconButton
          boxSize="52px"
          borderRadius="full"
          colorPalette="brand"
          boxShadow="0 10px 24px -6px rgba(158,42,47,.6), inset 0 1px 0 rgba(255,255,255,.15)"
          _hover={{ bg: "brand.emphasized" }}
          css={{ "& svg": { width: "22px", height: "22px" } }}
          aria-label="Add assignment"
          title="Add assignment"
          onClick={() => setIsAddOpen(true)}
        >
          <LuPlus />
        </IconButton>
      </Box>

      {dialog(
        isAddOpen,
        setIsAddOpen,
        <TaskForm
          courses={courses}
          onSubmit={(data) => {
            setIsAddOpen(false);
            if (c) addAssignment(data, c.userId);
          }}
        />,
      )}

      {dialog(
        !!editing,
        (open) => !open && setEditing(null),
        editing && (
          <TaskForm
            key={editing.id}
            courses={courses}
            initial={{
              assignment: editing.assignment,
              course: editing.course,
              due: toDay(editing.due),
            }}
            onSubmit={(data: TaskFormData) => {
              updateAssignment(editing.id, {
                assignment: data.assignment,
                course: data.course,
                due: new Date(endOfDayIso(data.due)),
              });
              setEditing(null);
            }}
            onDelete={() => {
              deleteAssignment(editing.id);
              setEditing(null);
            }}
          />
        ),
      )}
    </>
  );
}
