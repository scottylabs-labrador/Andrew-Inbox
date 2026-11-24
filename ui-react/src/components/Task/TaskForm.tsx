import {
  Box,
  Button,
  Dialog,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LuChevronDown, LuX } from "react-icons/lu";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { readJson, removeKey, writeJson } from "@/storage";
import { useCourseColor, useCourseName, useResolveCourse } from "@/courseColors";
import PressMenu, { menuKey, useMenuHot } from "../PressMenu";

const schema = z.object({
  assignment: z.string().trim().min(1, { message: "Give it a name." }),
  course: z.string().trim().min(1, { message: "Class is required." }),
  due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Check the month, day, and year." }),
  time: z.string().regex(/^\d{2}:\d{2}$/, { message: "Check the hour, minute, and A or P." }),
});

export type TaskFormData = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: TaskFormData) => void;
  // Filled in when editing a task you added yourself
  initial?: TaskFormData;
  onDelete?: () => void;
  courses: string[];
  // Where unsaved typing is kept, so closing the popup mid-way doesn't lose it.
  // The parent removes it when the dialog is closed on purpose.
  draftKey?: string;
}

// What you type, and the full name the box shows once it knows the month.
const MONTHS: { name: string; aliases: string[] }[] = [
  { name: "January", aliases: ["ja", "jan", "january"] },
  { name: "February", aliases: ["f", "feb", "february"] },
  { name: "March", aliases: ["mar", "march"] },
  { name: "April", aliases: ["ap", "apr", "april"] },
  { name: "May", aliases: ["may"] },
  { name: "June", aliases: ["jun", "june"] },
  { name: "July", aliases: ["jul", "july"] },
  { name: "August", aliases: ["au", "aug", "august"] },
  { name: "September", aliases: ["se", "sep", "sept", "september"] },
  { name: "October", aliases: ["o", "oct", "october"] },
  { name: "November", aliases: ["n", "nov", "november"] },
  { name: "December", aliases: ["d", "dec", "december"] },
];

const pad = (n: number) => String(n).padStart(2, "0");
const toDay = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Shared look for the text boxes
const fieldStyle = {
  h: 10,
  bg: "bg",
  borderColor: "border",
  borderRadius: "9px",
  fontSize: "14px",
} as const;

function monthsMatching(raw: string) {
  const typed = raw.trim().toLowerCase();
  if (!typed) return [];
  return MONTHS.filter(
    (month) =>
      month.name.toLowerCase().startsWith(typed) ||
      month.aliases.some((alias) => alias.startsWith(typed)),
  );
}

function parseYear(raw: string) {
  const typed = raw.trim();
  if (/^\d{2}$/.test(typed)) return 2000 + Number(typed);
  if (/^\d{4}$/.test(typed)) return Number(typed);
  return null;
}

function focusNext(field: HTMLInputElement | null) {
  if (!field) return;
  field.focus();
  field.select();
}

// Clicking a box selects what's there, so the next key replaces it.
const selectOnFocus = {
  onFocus: (e: { currentTarget: HTMLInputElement }) => e.currentTarget.select(),
  onMouseUp: (e: { preventDefault: () => void }) => e.preventDefault(),
};

function PartField({
  label,
  value,
  onChange,
  onBlur,
  onKeyDown,
  inputRef,
  span,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  span: number;
}) {
  const localRef = useRef<HTMLInputElement>(null);
  const selectAll = () => {
    const el = localRef.current;
    if (!el) return;
    el.focus();
    el.select();
  };
  return (
    <Box
      gridColumn={`span ${span}`}
      h={10}
      bg="bg"
      borderWidth="1px"
      borderColor="border"
      borderRadius="9px"
      display="flex"
      onMouseDown={(e) => {
        // Keep the click from dropping the caret in the middle of the word.
        e.preventDefault();
        selectAll();
      }}
    >
      <Input
        ref={(node) => {
          localRef.current = node;
          if (inputRef) inputRef.current = node;
        }}
        aria-label={label}
        value={value}
        h="100%"
        w="100%"
        minW={0}
        px={2}
        border="none"
        bg="transparent"
        fontSize="14px"
        textAlign="center"
        autoComplete="off"
        _focus={{ outline: "none", boxShadow: "none" }}
        onFocus={selectAll}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      />
    </Box>
  );
}

// Month, day, and year on one row. Hour and minute share the next box.
// Typing the short month code still fills in the full name, and a finished
// box jumps to the next one. From November, D21261, Tab, 22p is Dec 21, 2026, 1:22 PM.
function DueFields({
  due,
  time,
  onDue,
  onTime,
}: {
  due: string;
  time: string;
  onDue: (day: string) => void;
  onTime: (time: string) => void;
}) {
  const [yearNum, monthNum, dayNum] = (due || toDay(new Date())).split("-").map(Number);
  const clock = splitTime(time || "23:59");
  const saved = useRef({
    month: monthNum,
    day: dayNum,
    year: yearNum,
    hour: clock.hour12,
    minute: clock.minute,
    pm: clock.ampm === "PM",
  });
  const [month, setMonth] = useState(MONTHS[monthNum - 1]?.name ?? "");
  const [day, setDay] = useState(String(dayNum));
  const [year, setYear] = useState(String(yearNum));
  const [hour, setHour] = useState(String(clock.hour12));
  const [minute, setMinute] = useState(pad(clock.minute));
  const [meridian, setMeridian] = useState(clock.ampm);

  const dayRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const hourRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);
  const meridianRef = useRef<HTMLInputElement>(null);

  const writeDue = (monthAt: number, dayAt: number, yearAt: number) => {
    const days = new Date(yearAt, monthAt, 0).getDate();
    const safeDay = Math.min(Math.max(dayAt, 1), days);
    saved.current = { ...saved.current, month: monthAt, day: safeDay, year: yearAt };
    setDay(String(safeDay));
    onDue(`${yearAt}-${pad(monthAt)}-${pad(safeDay)}`);
  };

  const writeTime = (hourAt: number, minuteAt: number, pm: boolean) => {
    saved.current = { ...saved.current, hour: hourAt, minute: minuteAt, pm };
    onTime(joinTime(hourAt, minuteAt, pm ? "PM" : "AM"));
  };

  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={2}>
      <PartField
        span={5}
        label="Month"
        value={month}
        onChange={(raw) => {
          const typed = raw.replace(/[^a-zA-Z]/g, "");
          const hits = monthsMatching(typed);
          if (hits.length === 1) {
            const at = MONTHS.indexOf(hits[0]) + 1;
            setMonth(hits[0].name);
            writeDue(at, Number(day) || saved.current.day, parseYear(year) || saved.current.year);
            focusNext(dayRef.current);
            return;
          }
          setMonth(typed);
        }}
        onBlur={() => setMonth(MONTHS[saved.current.month - 1]?.name ?? month)}
      />
      <PartField
        span={3}
        label="Day"
        inputRef={dayRef}
        value={day}
        onChange={(raw) => {
          const digits = raw.replace(/\D/g, "").slice(0, 2);
          setDay(digits);
          const n = Number(digits);
          const done = (digits.length === 1 && n >= 4) || (digits.length === 2 && n >= 1 && n <= 31);
          if (!done) return;
          writeDue(saved.current.month, n, saved.current.year);
          focusNext(yearRef.current);
        }}
        onBlur={() => setDay(String(saved.current.day))}
      />
      <PartField
        span={4}
        label="Year"
        inputRef={yearRef}
        value={year}
        onChange={(raw) => {
          // Must start with 20, then the last two digits (e.g. 2026).
          const digits = raw.replace(/\D/g, "").slice(0, 4);
          setYear(digits);
          if (digits.length < 4) return;
          if (!digits.startsWith("20")) return;
          const full = Number(digits);
          setYear(String(full));
          writeDue(saved.current.month, saved.current.day, full);
          focusNext(hourRef.current);
        }}
        onBlur={() => {
          if (/^20\d{2}$/.test(year)) {
            writeDue(saved.current.month, saved.current.day, Number(year));
          } else {
            setYear(String(saved.current.year));
          }
        }}
      />
      <HStack
        gridColumn="span 8"
        h={10}
        gap={0}
        bg="bg"
        borderWidth="1px"
        borderColor="border"
        borderRadius="9px"
        px={1}
      >
        <Input
          ref={hourRef}
          aria-label="Hour"
          value={hour}
          {...selectOnFocus}
          h="100%"
          w="45%"
          px={1}
          border="none"
          bg="transparent"
          textAlign="right"
          fontSize="14px"
          autoComplete="off"
          _focus={{ outline: "none", boxShadow: "none" }}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
            if (digits.length === 2 && digits[0] === "1" && Number(digits) > 12) {
              setHour("1");
              saved.current.hour = 1;
              const rest = digits[1];
              setMinute(rest);
              minuteRef.current?.focus();
              return;
            }
            setHour(digits);
            const n = Number(digits);
            if ((digits.length === 1 && n >= 2 && n <= 9) || (digits.length === 2 && n >= 10 && n <= 12)) {
              saved.current.hour = n;
              setHour(String(n));
              focusNext(minuteRef.current);
            }
          }}
          onBlur={(e) => {
            const n = Number(e.currentTarget.value);
            if (n >= 1 && n <= 12) {
              saved.current.hour = n;
              setHour(String(n));
              writeTime(n, saved.current.minute, saved.current.pm);
            } else setHour(String(saved.current.hour));
          }}
        />
        <Text color="fg.muted" fontSize="14px" userSelect="none">:</Text>
        <Input
          ref={minuteRef}
          aria-label="Minute"
          value={minute}
          {...selectOnFocus}
          h="100%"
          w="45%"
          px={1}
          border="none"
          bg="transparent"
          textAlign="left"
          fontSize="14px"
          autoComplete="off"
          _focus={{ outline: "none", boxShadow: "none" }}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
            setMinute(digits);
            const n = Number(digits);
            const done = (digits.length === 1 && n >= 6) || (digits.length === 2 && n <= 59);
            if (!done) return;
            setMinute(pad(n));
            writeTime(saved.current.hour, n, saved.current.pm);
            focusNext(meridianRef.current);
          }}
          onBlur={(e) => {
            const n = Number(e.currentTarget.value);
            if (e.currentTarget.value !== "" && n >= 0 && n <= 59) {
              setMinute(pad(n));
              writeTime(saved.current.hour, n, saved.current.pm);
            } else setMinute(pad(saved.current.minute));
          }}
        />
      </HStack>
      <PartField
        span={4}
        label="AM or PM"
        inputRef={meridianRef}
        value={meridian}
        onKeyDown={(e) => {
          // Delete / Backspace clears the whole AM/PM so A, AM, P, or PM can be typed next.
          if ((e.key === "Backspace" || e.key === "Delete") && meridian) {
            e.preventDefault();
            setMeridian("");
          }
        }}
        onChange={(raw) => {
          const typed = raw.trim().toLowerCase();
          if (!typed) {
            setMeridian("");
            return;
          }
          if (typed === "p" || typed === "pm") {
            setMeridian("PM");
            writeTime(saved.current.hour, saved.current.minute, true);
            return;
          }
          if (typed === "a" || typed === "am") {
            setMeridian("AM");
            writeTime(saved.current.hour, saved.current.minute, false);
            return;
          }
          setMeridian(raw.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase());
        }}
        onBlur={() => {
          if (meridian === "AM" || meridian === "PM") return;
          setMeridian(saved.current.pm ? "PM" : "AM");
        }}
      />
    </Box>
  );
}

function ClassRow({ course }: { course: string }) {
  const name = useCourseName(course);
  const color = useCourseColor(course);
  const hot = useMenuHot(menuKey("pick", course));
  return (
    <HStack
      data-act="pick"
      data-code={course}
      data-key={menuKey("pick", course)}
      gap={2.5}
      px={2.5}
      py={2}
      borderRadius="7px"
      cursor="pointer"
      userSelect="none"
      bg={hot ? "bg.muted" : "transparent"}
      _hover={{ bg: "bg.muted" }}
    >
      <Box boxSize="14px" borderRadius="full" bg={color} flexShrink={0} />
      <Text flex={1} minW={0} fontSize="14px" fontWeight="medium" truncate>
        {name}
      </Text>
      {name !== course && (
        <Text fontSize="11px" color="fg.subtle" flexShrink={0}>
          ({course})
        </Text>
      )}
    </HStack>
  );
}

function ClassField({
  courses,
  value,
  onChange,
}: {
  courses: string[];
  value: string;
  onChange: (course: string) => void;
}) {
  const name = useCourseName(value);
  return (
    <PressMenu
      fullWidth
      width="332px"
      closeOnActivate
      onActivate={(el) => {
        if (el.dataset.code) onChange(el.dataset.code);
      }}
      trigger={
        <HStack
          role="button"
          tabIndex={0}
          w="100%"
          h={10}
          px={3}
          gap={2}
          bg="bg"
          borderWidth="1px"
          borderColor="border"
          borderRadius="9px"
          cursor="pointer"
          outline="none"
          _focus={{ outline: "none", boxShadow: "none" }}
        >
          <Text flex={1} minW={0} truncate textAlign="left" fontSize="14px" color={value ? "fg" : "fg.muted"}>
            {value ? name : "Class"}
          </Text>
          <LuChevronDown size={16} />
        </HStack>
      }
    >
      <Box maxH="220px" overflowY="auto">
        {courses.length > 0 ? (
          courses.map((course) => <ClassRow key={course} course={course} />)
        ) : (
          <Text px={2.5} py={2} fontSize="13px" color="fg.muted">
            No classes yet
          </Text>
        )}
      </Box>
    </PressMenu>
  );
}

const blank = (): TaskFormData => ({
  assignment: "",
  course: "",
  due: toDay(new Date()),
  time: "23:59",
});

function splitTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  return { hour12: h % 12 || 12, minute: Number.isFinite(m) ? m : 59, ampm: h >= 12 ? "PM" : "AM" };
}

function joinTime(hour12: number, minute: number, ampm: string) {
  const hour = (hour12 % 12) + (ampm === "PM" ? 12 : 0);
  return `${pad(hour)}:${pad(minute)}`;
}

export default function TaskForm({ onSubmit, initial, onDelete, courses, draftKey }: Props) {
  const resolveCourse = useResolveCourse();
  const saved = draftKey ? readJson<Partial<TaskFormData>>(draftKey) : null;
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(schema),
    defaultValues: { ...blank(), ...initial, ...saved },
  });

  const values = useWatch({ control });
  const due = values.due ?? "";
  const time = values.time || "23:59";

  // Save what's typed as it changes; nothing is kept while it still matches
  // what the form started with
  useEffect(() => {
    if (!draftKey) return;
    const start = initial ?? blank();
    const changed = (Object.keys(start) as (keyof TaskFormData)[]).some(
      (k) => (values[k] ?? "") !== start[k],
    );
    if (changed) writeJson(draftKey, values);
    else removeKey(draftKey);
  }, [draftKey, initial, values]);

  const onInternalSubmit = (data: TaskFormData) => {
    if (!initial) reset(blank());
    if (draftKey) removeKey(draftKey);
    onSubmit({ ...data, course: resolveCourse(data.course) });
  };

  return (
    <form onSubmit={handleSubmit(onInternalSubmit)}>
      <HStack justify="space-between" px="18px" pt="18px" pb={4}>
        <Dialog.Title fontSize="18px" fontWeight="bold" letterSpacing="-0.01em">
          {initial ? "Edit assignment" : "Add assignment"}
        </Dialog.Title>
        <Dialog.CloseTrigger asChild position="static">
          <IconButton size="xs" variant="ghost" color="fg.muted" aria-label="Close">
            <LuX />
          </IconButton>
        </Dialog.CloseTrigger>
      </HStack>
      <Dialog.Body px="18px" py={0}>
        <VStack gap={4} align="stretch">
          <Box>
            <Input
              {...register("assignment")}
              {...fieldStyle}
              placeholder="Assignment"
              autoFocus
            />
            {errors.assignment && (
              <Text color="red.fg" fontSize="xs" mt={1}>
                {errors.assignment.message}
              </Text>
            )}
          </Box>

          <Box>
            <ClassField
              courses={courses}
              value={values.course ?? ""}
              onChange={(course) => setValue("course", course, { shouldValidate: true })}
            />
            {errors.course && (
              <Text color="red.fg" fontSize="xs" mt={1}>
                {errors.course.message}
              </Text>
            )}
          </Box>

          <Box>
            <DueFields
              due={due}
              time={time}
              onDue={(day) => setValue("due", day, { shouldValidate: true })}
              onTime={(next) => setValue("time", next, { shouldValidate: true })}
            />
            {(errors.due || errors.time) && (
              <Text color="red.fg" fontSize="xs" mt={1}>
                {errors.due?.message || errors.time?.message}
              </Text>
            )}
          </Box>
        </VStack>
      </Dialog.Body>
      <Dialog.Footer px="18px" pt={5} pb="18px" gap={2}>
        {onDelete && (
          <Button
            variant="ghost"
            colorPalette="red"
            h={10}
            px={3}
            borderRadius="9px"
            fontSize="14px"
            mr="auto"
            onClick={onDelete}
          >
            Delete
          </Button>
        )}
        <Button
          type="submit"
          colorPalette="brand"
          h={10}
          px="22px"
          borderRadius="9px"
          fontSize="14px"
          fontWeight="semibold"
          _hover={{ bg: "brand.emphasized" }}
        >
          {initial ? "Save" : "Add"}
        </Button>
      </Dialog.Footer>
    </form>
  );
}
