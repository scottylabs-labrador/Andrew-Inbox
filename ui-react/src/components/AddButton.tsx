import {
  Box,
  Button,
  CloseButton,
  Dialog,
  HStack,
  Input,
  VStack,
} from "@chakra-ui/react";

export default function AddButton() {
  return (
    <>
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
              placeholder="What needs to be done?"
              bg="gray.800"
              border="none"
              fontSize="sm"
            />
          </Box>

          <HStack gap={4}>
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
                placeholder="12-345"
                bg="gray.800"
                border="none"
                fontSize="sm"
              />
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
              <Input type="date" bg="gray.800" border="none" fontSize="sm" />
            </Box>
          </HStack>
        </VStack>
      </Dialog.Body>
      <Dialog.Footer bg="gray.700" pt={2}>
        <Dialog.ActionTrigger asChild>
          <HStack>
            <Button
              variant="ghost"
              color="gray.400"
              _hover={{ bg: "gray.800" }}
            >
              Cancel
            </Button>
            <Button
              bg="blue.600"
              color="white"
              _hover={{ bg: "blue.500" }}
              px={6}
            >
              Save
            </Button>
          </HStack>
        </Dialog.ActionTrigger>
      </Dialog.Footer>
    </>
  );
}
