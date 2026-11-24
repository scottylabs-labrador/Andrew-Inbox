import { createContext, useContext, useMemo, type ReactNode } from "react";
import { storageKey, usePersistentState } from "@/storage";

// Red, orange, yellow, green, blue, purple, pink. Clicking a course's dot
// walks this list. Yellow is lighter so it stays readable on the dark popup.
export const COURSE_PALETTE = [
  "oklch(0.68 0.16 25)",
  "oklch(0.74 0.15 55)",
  "oklch(0.86 0.14 95)",
  "oklch(0.72 0.14 150)",
  "oklch(0.66 0.14 250)",
  "oklch(0.64 0.15 310)",
  "oklch(0.74 0.14 355)",
] as const;

// The sorted list of the user's classes, for the default color before they pick one.
export const CourseListContext = createContext<string[]>([]);

export function defaultColorIndex(course: string, courses: string[]) {
  let index = courses.indexOf(course);
  if (index === -1) {
    index = 0;
    for (const ch of course) index = (index * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return index % COURSE_PALETTE.length;
}

interface CoursePrefs {
  names: Record<string, string>;
  colorIndex: Record<string, number>;
  setName: (course: string, name: string) => void;
  cycleColor: (course: string) => void;
}

const CoursePrefsContext = createContext<CoursePrefs | null>(null);

export function CoursePrefsProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [names, setNames] = usePersistentState<Record<string, string>>(
    storageKey(userId, "course-names"),
    {},
  );
  const [colorIndex, setColorIndex] = usePersistentState<Record<string, number>>(
    storageKey(userId, "course-colors"),
    {},
  );
  const courses = useContext(CourseListContext);

  const value = useMemo<CoursePrefs>(() => ({
    names,
    colorIndex,
    setName: (course, name) => {
      const next = { ...names };
      const trimmed = name.trim();
      if (!trimmed || trimmed === course) delete next[course];
      else next[course] = trimmed;
      setNames(next);
    },
    cycleColor: (course) => {
      const current = colorIndex[course] ?? defaultColorIndex(course, courses);
      setColorIndex({ ...colorIndex, [course]: (current + 1) % COURSE_PALETTE.length });
    },
  }), [names, colorIndex, courses, setNames, setColorIndex]);

  return <CoursePrefsContext.Provider value={value}>{children}</CoursePrefsContext.Provider>;
}

export function useCourseColor(course: string) {
  const courses = useContext(CourseListContext);
  const prefs = useContext(CoursePrefsContext);
  const index = prefs?.colorIndex[course] ?? defaultColorIndex(course, courses);
  return COURSE_PALETTE[index];
}

// The name the user typed, or the course number when they haven't renamed it.
export function useCourseName(course: string) {
  const prefs = useContext(CoursePrefsContext);
  const custom = prefs?.names[course]?.trim();
  return custom && custom !== course ? custom : course;
}

// "Algebra" typed into Add assignment is stored as the real course number.
export function useResolveCourse() {
  const courses = useContext(CourseListContext);
  const prefs = useContext(CoursePrefsContext);
  return (input: string) => {
    const typed = input.trim();
    const match = courses.find(
      (course) => prefs?.names[course]?.trim().toLowerCase() === typed.toLowerCase(),
    );
    return match ?? typed;
  };
}

export function useCycleCourseColor() {
  const prefs = useContext(CoursePrefsContext);
  return (course: string) => prefs?.cycleColor(course);
}

export function useSetCourseName() {
  const prefs = useContext(CoursePrefsContext);
  return (course: string, name: string) => prefs?.setName(course, name);
}
