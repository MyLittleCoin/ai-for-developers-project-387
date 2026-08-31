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

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const hoursPart =
    hours > 0 ? `${hours} ${plural(hours, "час", "часа", "часов")}` : "";
  if (mins === 0) return hoursPart || "0 минут";
  const minsPart = `${mins} ${plural(mins, "минута", "минуты", "минут")}`;
  return hoursPart ? `${hoursPart} ${minsPart}` : minsPart;
}
