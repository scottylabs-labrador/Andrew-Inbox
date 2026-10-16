import type { Creds } from "@/App";
import { Box, Button, Text, Textarea } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  newTok: z.string().min(1, "Token cannot be empty"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  c: Creds | null;
  setC: (c: Creds) => void;
  onSubmit: (data: FormData) => void;
  errorMessage?: string | null;
}

export default function SettingChange({ c, onSubmit, errorMessage }: Props) {
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
    <Box display="flex" flexDirection="column" gap={4}>
      <Box
        px={4}
        py={3}
        bg="gray.900"
        borderRadius="lg"
        border="1px solid"
        borderColor="gray.700"
      >
        <Text fontSize="sm" fontWeight="bold" color="white">
          Account Details
        </Text>
      </Box>

      <Box display="flex" flexDirection="column" gap={4}>
        <Box
          bg="gray.900"
          p={3}
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.700"
        >
          <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={1}>
            Username
          </Text>
          <Text fontSize="sm" fontWeight="semibold" color="white">
            {c?.username ?? "Not logged in"}
          </Text>
        </Box>

        <Box
          bg="gray.900"
          p={3}
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.700"
        >
          <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={1}>
            Canvas Token
          </Text>
          <form onSubmit={handleSubmit(onInternalSubmit)}>
            <Box
              bg="gray.800"
              p={3}
              borderRadius="md"
              border="1px solid"
              borderColor="gray.700"
              mb={3}
            >
              <Textarea
                {...register("newTok")}
                placeholder={c?.token ?? "Enter Canvas Token"}
                variant="outline"
                minH="90px"
                color="white"
              />
            </Box>

            {(errors.newTok || errorMessage) && (
              <Text color="red.400" fontSize="xs" mb={2}>
                {errors.newTok?.message || errorMessage}
              </Text>
            )}

            <Button type="submit" bg="blue.500" color="white" size="sm" px={4}>
              Change Token
            </Button>
          </form>
        </Box>
      </Box>
    </Box>
  );
}
