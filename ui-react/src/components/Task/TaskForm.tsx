import { Box, Button, Dialog, HStack, Input, VStack } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Creds } from "@/App";

const schema = z.object({
  assignment: z
    .string()
    .min(3, { message: "Task must be at least 3 characters." }),
  course: z.string().min(1, { message: "Course is required." }),
  due: z.string().min(1, { message: "Date is required." }),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: FormData) => void;
}

export default function AddButton({ onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onInternalSubmit = (data: FormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <>
      <form onSubmit={handleSubmit(onInternalSubmit)}>
        <Dialog.Header borderBottom="1px solid" borderColor="gray.800" pb={3}>
          <Dialog.Title fontSize="lg" fontWeight="bold" color="white">
            Add Assignment
          </Dialog.Title>
        </Dialog.Header>
        <Dialog.Body py={2}>
          <VStack gap={4} align="stretch">
            <Box>
              <Box
                as="span"
                display="block"
                fontSize="xs"
                fontWeight="bold"
                color="gray.400"
                mb={1}
                textTransform="uppercase"
              >
                Assignment
              </Box>
              <Input
                {...register("assignment")}
                placeholder="e.g., Math Homework"
                bg="gray.800"
                border="none"
                fontSize="sm"
                color="white"
              />
              {errors.assignment && (
                <Box color="red.400" fontSize="xs" mt={1}>
                  {errors.assignment.message}
                </Box>
              )}
            </Box>

            <HStack gap={4} align="start">
              <Box flex={1}>
                <Box
                  as="span"
                  display="block"
                  fontSize="xs"
                  fontWeight="bold"
                  color="gray.400"
                  mb={1}
                  textTransform="uppercase"
                >
                  Course
                </Box>
                <Input
                  {...register("course")}
                  placeholder="12-345"
                  bg="gray.800"
                  border="none"
                  fontSize="sm"
                  color="white"
                />
                {errors.course && (
                  <Box color="red.400" fontSize="xs" mt={1}>
                    {errors.course.message}
                  </Box>
                )}
              </Box>

              <Box flex={1}>
                <Box
                  as="span"
                  display="block"
                  fontSize="xs"
                  fontWeight="bold"
                  color="gray.400"
                  mb={1}
                  textTransform="uppercase"
                >
                  Due Date
                </Box>
                <Input
                  {...register("due")}
                  type="date"
                  bg="gray.800"
                  border="none"
                  fontSize="sm"
                  color="white"
                  css={{
                    "&::-webkit-calendar-picker-indicator": {
                      filter: "invert(1)",
                    },
                  }}
                />
                {errors.due && (
                  <Box color="red.400" fontSize="xs" mt={1}>
                    {errors.due.message}
                  </Box>
                )}
              </Box>
            </HStack>
          </VStack>
        </Dialog.Body>
        <Dialog.Footer bg="gray.700" pt={2}>
          <Dialog.ActionTrigger asChild>
            <Button
              variant="ghost"
              color="gray.400"
              _hover={{ bg: "gray.800" }}
            >
              Cancel
            </Button>
          </Dialog.ActionTrigger>
          <Button type="submit" bg="blue.400" color="white" size="sm" px={6}>
            Add Task
          </Button>
        </Dialog.Footer>
      </form>
    </>
  );
}
