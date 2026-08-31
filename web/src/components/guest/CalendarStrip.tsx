import { cn } from "@/lib/utils";
import { formatStripDay } from "@/lib/dates";

export default function CalendarStrip({
  days,
  counts,
  selectedDay,
  onSelect,
}: {
  days: Date[];
  counts: Record<string, number>;
  selectedDay: Date;
  onSelect: (day: Date) => void;
}) {
  const weekday = (d: Date) =>
    d.toLocaleDateString("ru-RU", { weekday: "short" });
  const month = (d: Date) =>
    d.toLocaleDateString("ru-RU", { month: "short" });

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2"
      role="list"
      aria-label="Дни расписания"
    >
      {days.map((d) => {
        const key = formatStripDay(d);
        const isSelected =
          d.toDateString() === selectedDay.toDateString();
        const count = counts[key] ?? 0;
        return (
          <button
            key={d.toISOString()}
            type="button"
            aria-label={key}
            aria-pressed={isSelected}
            onClick={() => onSelect(d)}
            className={cn(
              "flex shrink-0 flex-col items-center gap-0.5 rounded-md border px-2.5 py-2 transition-colors",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-muted/60",
            )}
          >
            <span className="text-xs text-muted-foreground">{weekday(d)}</span>
            <span className="text-lg font-medium leading-tight">
              {d.getDate()}
            </span>
            <span className="text-xs text-muted-foreground">{month(d)}</span>
            {count > 0 && (
              <span
                aria-label={`${count} ${count === 1 ? "встреча" : "встреч"}`}
                className={cn(
                  "mt-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                  isSelected
                    ? "bg-primary-foreground text-primary"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
