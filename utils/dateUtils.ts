import { isSameDay } from "date-fns";
import { WorkEntry } from "@/types/work-entry";

export function getRecentEntries(selectedDate:Date, workEntries:WorkEntry[]) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = new Date(year, month, i + 1);
    if (day.getDay() === 0 || day.getDay() === 6) return null;
    const entry = workEntries.find((e) => isSameDay(e.date, day));
    return { date: day, location: entry?.location || null };
  }).filter(Boolean);
}

export function checkStartIsAfterEnd(start:Date, end:Date) {
  return start && end && start > end;
}
