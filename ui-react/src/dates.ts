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

// Finished work drops off the list (and out of the database) after this long
export const KEEP_DONE_DAYS = 30;

// Announcements only cover the last week (Piazza is scraped 7 days back)
export const ANNOUNCEMENT_DAYS = 7;

// Hides leftovers from past semesters. Spring: Dec 21 - Jun 7,
// summer: Jun 8 - Aug 24, fall: Aug 25 - Dec 20.
export function getSemesterRange(now = new Date()) {
  const year = now.getFullYear();
  if (now >= new Date(year, 11, 21) || now < new Date(year, 5, 8)) {
    const startYear = now.getMonth() === 11 ? year : year - 1;
    return {
      start: new Date(startYear, 11, 21),
      end: new Date(startYear + 1, 5, 8),
    };
  }
  if (now < new Date(year, 7, 25)) {
    return { start: new Date(year, 5, 8), end: new Date(year, 7, 25) };
  }
  return { start: new Date(year, 7, 25), end: new Date(year, 11, 21) };
}

// "just now", "5 minutes ago", "3 days ago"
export function timeAgo(date: Date, now = new Date()) {
  const minutes = Math.round((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
