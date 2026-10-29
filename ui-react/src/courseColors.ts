import { createContext, useContext } from "react";

// Each class gets its own dot color, the same everywhere it appears: one hue
// per class at the same lightness, so no class stands out more than another.
// The first hues are the most different from each other. Yellow is lighter so
// it doesn't turn muddy.
const HUES = [300, 150, 55, 230, 85, 0, 190, 260] as const;

const dot = (hue: number) =>
  `oklch(${hue === 85 ? 0.82 : 0.72} 0.13 ${hue})`;

// The sorted list of the user's classes. Colors are handed out in that order,
// so up to 8 classes never share a color.
export const CourseListContext = createContext<string[]>([]);

export function useCourseColor(course: string) {
  const courses = useContext(CourseListContext);
  let index = courses.indexOf(course);
  if (index === -1) {
    // Not in the list yet (e.g. just added by hand): fall back to a hash
    index = 0;
    for (const ch of course) index = (index * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return dot(HUES[index % HUES.length]);
}
