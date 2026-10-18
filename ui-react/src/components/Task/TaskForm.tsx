import {
  Box,
  Button,
  Dialog,
  HStack,
  Input,
  NativeSelect,
  VStack,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const months = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear + i).toString());
const days = Array.from({ length: 31 }, (_, i) => ({
  value: (i + 1).toString().padStart(2, "0"),
  label: (i + 1).toString(),
}));

const schema = z.object({
  assignment: z
    .string()
    .min(3, { message: "Task must be at least 3 characters." }),
  course: z.string().min(1, { message: "Course is required." }),
  month: z.string().min(1, { message: "Month is required." }),
  day: z.string().min(1, { message: "Day is required." }),
  year: z.string().min(1, { message: "Year is required." }),
});

type FormInputData = z.infer<typeof schema>;

export interface FormData {
  assignment: string;
  course: string;
  due: string;
}

interface Props {
  onSubmit: (data: FormData) => void;
}

export default function AddButton({ onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInputData>({
    resolver: zodResolver(schema),
    defaultValues: {
      month: "",
      day: "",
      year: currentYear.toString(),
    },
  });

  const onInternalSubmit = (data: FormInputData) => {
    const formattedDue = `${data.year}-${data.month}-${data.day}`;
    onSubmit({
      assignment: data.assignment,
      course: data.course,
      due: formattedDue,
    });
    reset();
  };

  const selectFieldProps = {
    bg: "gray.800",
    border: "1px solid",
    borderColor: "gray.700",
    borderRadius: "md",
    fontSize: "xs",
    color: "white",
    height: "36px",
    px: 2,
    _focus: { borderColor: "blue.400" },
  };

  return (
    <form onSubmit={handleSubmit(onInternalSubmit)}>
      <Dialog.Header borderBottom="1px solid" borderColor="gray.800" pb={3}>
        <Dialog.Title fontSize="lg" fontWeight="bold" color="white">
          Add Assignment
        </Dialog.Title>
      </Dialog.Header>

      <Dialog.Body py={4}>
        <VStack gap={4} align="stretch">
          <Box>
            <Box
              as="span"
              display="block"
              fontSize="xs"
              fontWeight="bold"
              color="gray.400"
              mb={1.5}
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Assignment
            </Box>
            <Input
              {...register("assignment")}
              placeholder="e.g., Math Homework"
              bg="gray.800"
              border="1px solid"
              borderColor="gray.700"
              fontSize="sm"
              color="white"
              height="36px"
              _placeholder={{ color: "gray.500" }}
              _focus={{ borderColor: "blue.400" }}
            />
            {errors.assignment && (
              <Box color="red.400" fontSize="xs" mt={1}>
                {errors.assignment.message}
              </Box>
            )}
          </Box>

          <HStack gap={3} align="start">
            <Box flex={1}>
              <Box
                as="span"
                display="block"
                fontSize="xs"
                fontWeight="bold"
                color="gray.400"
                mb={1.5}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Course
              </Box>
              <Input
                {...register("course")}
                placeholder="12-345"
                bg="gray.800"
                border="1px solid"
                borderColor="gray.700"
                fontSize="sm"
                color="white"
                height="36px"
                _placeholder={{ color: "gray.500" }}
                _focus={{ borderColor: "blue.400" }}
              />
              {errors.course && (
                <Box color="red.400" fontSize="xs" mt={1}>
                  {errors.course.message}
                </Box>
              )}
            </Box>

            <Box flex={2}>
              <Box
                as="span"
                display="block"
                fontSize="xs"
                fontWeight="bold"
                color="gray.400"
                mb={1.5}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Due Date
              </Box>
              <HStack gap={1.5}>
                {/* Month Select */}
                <Box flex={1.3}>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      {...register("month")}
                      {...selectFieldProps}
                    >
                      <option
                        value=""
                        disabled
                        style={{ background: "#1F2937" }}
                      >
                        Month
                      </option>
                      {months.map((m) => (
                        <option
                          key={m.value}
                          value={m.value}
                          style={{ background: "#1F2937" }}
                        >
                          {m.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Box>

                {/* Day Select */}
                <Box flex={1}>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      {...register("day")}
                      {...selectFieldProps}
                    >
                      <option
                        value=""
                        disabled
                        style={{ background: "#1F2937" }}
                      >
                        Day
                      </option>
                      {days.map((d) => (
                        <option
                          key={d.value}
                          value={d.value}
                          style={{ background: "#1F2937" }}
                        >
                          {d.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Box>

                {/* Year Select */}
                <Box flex={1.1}>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      {...register("year")}
                      {...selectFieldProps}
                    >
                      <option
                        value=""
                        disabled
                        style={{ background: "#1F2937" }}
                      >
                        Year
                      </option>
                      {years.map((y) => (
                        <option
                          key={y}
                          value={y}
                          style={{ background: "#1F2937" }}
                        >
                          {y}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Box>
              </HStack>

              {(errors.month || errors.day || errors.year) && (
                <Box color="red.400" fontSize="xs" mt={1}>
                  {errors.month?.message ||
                    errors.day?.message ||
                    errors.year?.message}
                </Box>
              )}
            </Box>
          </HStack>
        </VStack>
      </Dialog.Body>

      <Dialog.Footer
        bg="gray.900"
        pt={3}
        pb={3}
        borderTop="1px solid"
        borderColor="gray.800"
      >
        <Dialog.ActionTrigger asChild>
          <Button
            variant="ghost"
            color="gray.400"
            size="sm"
            _hover={{ bg: "gray.800", color: "white" }}
          >
            Cancel
          </Button>
        </Dialog.ActionTrigger>
        <Button type="submit" colorPalette="blue" size="sm" px={5}>
          Add Task
        </Button>
      </Dialog.Footer>
    </form>
  );
}
