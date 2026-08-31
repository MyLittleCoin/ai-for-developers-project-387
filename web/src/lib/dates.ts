import { addDays, startOfDay, format } from "date-fns";

export function formatStripDay(d: Date) {
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function dayWindow(now = new Date(), days = 14) {
  const start = startOfDay(now);
  const daysList: Date[] = [];
  for (let i = 0; i < days; i++) {
    daysList.push(addDays(start, i));
  }
  return {
    days: daysList,
    fromISO: start.toISOString(),
    toISO: addDays(start, days).toISOString(),
  };
}

export function formatTime(iso: string) {
  return format(new Date(iso), "HH:mm");
}

export function formatDateTime(iso: string) {
  return format(new Date(iso), "dd.MM.yyyy HH:mm");
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} ч` : `${hours} ч ${rest} мин`;
}
