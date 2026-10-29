import {
  Box,
  Button,
  Dialog,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LuX } from "react-icons/lu";

const schema = z.object({
  assignment: z.string().trim().min(1, { message: "Give it a name." }),
  course: z.string().trim().min(1, { message: "Class is required." }),
  due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Pick a date." }),
});

export type TaskFormData = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: TaskFormData) => void;
  // Filled in when editing a task you added yourself
  initial?: TaskFormData;
  onDelete?: () => void;
  courses: string[];
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toDay = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function Label({ children }: { children: string }) {
  return (
    <Text
      fontSize="11px"
      fontWeight="semibold"
      color="fg.muted"
      mb="6px"
      textTransform="uppercase"
      letterSpacing="0.08em"
    >
      {children}
    </Text>
  );
}

// Shared look for the text boxes and dropdowns
const fieldStyle = {
  h: 10,
  bg: "bg",
  borderColor: "border",
  borderRadius: "9px",
  fontSize: "14px",
} as const;

// Month / Day / Year dropdowns. Firefox can't open the browser's built-in date
// picker inside an extension popup, but plain dropdowns work everywhere.
function DateSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (day: string) => void;
}) {
  const [year, month, day] = value.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const thisYear = new Date().getFullYear();

  const set = (y: number, m: number, d: number) =>
    onChange(`${y}-${pad(m)}-${pad(Math.min(d, new Date(y, m, 0).getDate()))}`);

  const select = (
    label: string,
    current: number,
    options: { value: number; label: string }[],
    update: (v: number) => void,
    flex: number,
  ) => (
    <NativeSelect.Root size="sm" flex={flex}>
      <NativeSelect.Field
        {...fieldStyle}
        aria-label={label}
        value={current}
        onChange={(e) => update(Number(e.currentTarget.value))}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator color="fg.muted" />
    </NativeSelect.Root>
  );

  return (
    <HStack gap={2}>
      {select(
        "Month",
        month,
        MONTHS.map((m, i) => ({ value: i + 1, label: m })),
        (m) => set(year, m, day),
        13,
      )}
      {select(
        "Day",
        day,
        Array.from({ length: daysInMonth }, (_, i) => ({
          value: i + 1,
          label: String(i + 1),
        })),
        (d) => set(year, month, d),
        10,
      )}
      {select(
        "Year",
        year,
        [...new Set([year, thisYear, thisYear + 1])]
          .sort()
          .map((y) => ({ value: y, label: String(y) })),
        (y) => set(y, month, day),
        11,
      )}
    </HStack>
  );
}

export default function TaskForm({ onSubmit, initial, onDelete, courses }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? { assignment: "", course: "", due: toDay(new Date()) },
  });

  const due = useWatch({ control, name: "due" });

  const onInternalSubmit = (data: TaskFormData) => {
    onSubmit(data);
    if (!initial) reset({ assignment: "", course: "", due: toDay(new Date()) });
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
            <Label>Assignment</Label>
            <Input
              {...register("assignment")}
              {...fieldStyle}
              placeholder="e.g. HW 3"
              autoFocus
            />
            {errors.assignment && (
              <Text color="red.fg" fontSize="xs" mt={1}>
                {errors.assignment.message}
              </Text>
            )}
          </Box>

          <Box>
            <Label>Class</Label>
            <Input
              {...register("course")}
              {...fieldStyle}
              fontFamily="mono"
              fontSize="13px"
              placeholder="e.g. 21-241"
              list="andrew-inbox-courses"
              autoComplete="off"
            />
            <datalist id="andrew-inbox-courses">
              {courses.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {errors.course && (
              <Text color="red.fg" fontSize="xs" mt={1}>
                {errors.course.message}
              </Text>
            )}
          </Box>

          <Box>
            <Label>Due date</Label>
            <DateSelect
              value={due}
              onChange={(day) => setValue("due", day, { shouldValidate: true })}
            />
            {errors.due && (
              <Text color="red.fg" fontSize="xs" mt={1}>
                {errors.due.message}
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
        <Dialog.ActionTrigger asChild>
          <Button variant="ghost" h={10} px={4} borderRadius="9px" fontSize="14px" fontWeight="semibold" color="fg.muted">
            Cancel
          </Button>
        </Dialog.ActionTrigger>
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
