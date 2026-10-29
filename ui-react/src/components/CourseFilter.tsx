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
        h="36px"
        fontSize="13px"
        bg="bg.panel"
        borderColor="border.muted"
        borderRadius="9px"
        value={selected ?? ""}
        onChange={(e) => setSelected(e.currentTarget.value || null)}
      >
        <option value="">All classes</option>
        {courses.map((course) => (
          <option key={course} value={course}>
            {course}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator color="fg.muted" />
    </NativeSelect.Root>
  );
}
