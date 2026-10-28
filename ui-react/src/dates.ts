// Shared date rules for the Day / Week / Month filters. Everything works on real
// timestamps in the user's own timezone, so "due 11:59 PM tonight" is today.

export type TimeFilter = "All" | "Day" | "Week" | "Month";

// How many days each filter covers, counting today as day 1
const WINDOW_DAYS: Record<Exclude<TimeFilter, "All">, number> = {
  Day: 1,
  Week: 7,
  Month: 30,
};

export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addDays = (d: Date, days: number) => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

// Assignments: due from the start of today through the end of the window
// (Week = today + the next 6 days, Month = today + the next 29 days).
export function isDueInWindow(due: Date, filter: string, now = new Date()) {
  if (!(filter in WINDOW_DAYS)) return true;
  const today = startOfDay(now);
  const end = addDays(today, WINDOW_DAYS[filter as keyof typeof WINDOW_DAYS]);
  return due >= today && due < end;
}

// Announcements: posted from the start of the window through now
// (Week = today + the previous 6 days).
export function isPostedInWindow(posted: Date, filter: string, now = new Date()) {
  if (!(filter in WINDOW_DAYS)) return true;
  const start = addDays(
    startOfDay(now),
    1 - WINDOW_DAYS[filter as keyof typeof WINDOW_DAYS],
  );
  return posted >= start;
}

export const isOverdue = (due: Date, done: boolean, now = new Date()) =>
  !done && due < now;
