import { format } from "date-fns";
import type { Booking } from "@/lib/api";

const HOUR_PX = 48;

export default function DailyTimeline({
  day,
  meetings,
}: {
  day: Date;
  meetings: Booking[];
}) {
  if (meetings.length === 0) {
    return (
      <p className="text-muted-foreground">В этот день встреч нет</p>
    );
  }

  const startOfDayTime = day.getTime();
  const startMinutes = meetings
    .map((m) => {
      const t = new Date(m.startAt).getTime() - startOfDayTime;
      return Math.floor(t / 60_000);
    })
    .sort((a, b) => a - b)[0];
  const endMinutes = meetings
    .map((m) => {
      const t = new Date(m.endAt).getTime() - startOfDayTime;
      return Math.ceil(t / 60_000);
    })
    .sort((a, b) => b - a)[0];

  const startHour = Math.floor(startMinutes / 60);
  const endHour = Math.ceil(endMinutes / 60) || startHour + 1;
  const rangeMins = (endHour - startHour) * 60;

  const hourLabel = (hour: number) =>
    format(
      new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        hour,
        0,
        0,
      ),
      "HH:00",
    );

  return (
    <div
      aria-label="Шкала времени"
      role="list"
      className="relative mt-4"
      style={{ height: (endHour - startHour) * HOUR_PX, minHeight: HOUR_PX }}
    >
      {Array.from(
        { length: endHour - startHour + 1 },
        (_, i) => i + startHour,
      ).map((hour) => (
        <div
          key={hour}
          className="absolute left-0 right-0 border-t border-muted"
          style={{ top: (hour - startHour) * HOUR_PX }}
        >
          <span className="absolute -top-2 left-0 -translate-x-1/2 text-xs text-muted-foreground">
            {hourLabel(hour)}
          </span>
        </div>
      ))}

      {meetings.map((m) => {
        const startMin =
          (new Date(m.startAt).getTime() - startOfDayTime) / 60_000;
        const endMin =
          (new Date(m.endAt).getTime() - startOfDayTime) / 60_000;
        const top = ((startMin - startHour * 60) / rangeMins) * 100;
        const height = ((endMin - startMin) / rangeMins) * 100;

        return (
          <div
            key={m.id}
            role="listitem"
            className="absolute right-0 left-10 overflow-hidden rounded-md border-l-2 border-primary bg-primary/10 px-2 py-1"
            style={{ top: `${top}%`, height: `calc(${height}% - 2px)` }}
          >
            <p className="truncate text-sm font-medium">{m.guestName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {m.eventTypeId} · {format(new Date(m.startAt), "HH:mm")} —{" "}
              {format(new Date(m.endAt), "HH:mm")}
            </p>
          </div>
        );
      })}
    </div>
  );
}
