import { NativeSelect } from "@chakra-ui/react";

interface Props {
  courses: string[];
  selected: string | null;
  setSelected: (course: string | null) => void;
}

export default function CourseFilter({ courses, selected, setSelected }: Props) {
  return (
    <NativeSelect.Root size="sm">
      <NativeSelect.Field
        aria-label="Filter by class"
        value={selected ?? ""}
        onChange={(e) => setSelected(e.currentTarget.value || null)}
        bg="gray.700"
        border="none"
        color="white"
        fontSize="xs"
      >
        <option value="" style={{ background: "#2D3748" }}>
          All classes
        </option>
        {courses.map((course) => (
          <option key={course} value={course} style={{ background: "#2D3748" }}>
            {course}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator color="gray.400" />
    </NativeSelect.Root>
  );
}
