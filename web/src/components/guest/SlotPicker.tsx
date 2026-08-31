import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSlots } from "@/features/guest/useSlots";
import { dayWindow, formatTime } from "@/lib/dates";

export default function SlotPicker({
  eventTypeId,
  value,
  onChange,
}: {
  eventTypeId: string;
  value: string | null;
  onChange: (iso: string | null) => void;
}) {
  const { days } = dayWindow();
  const [day, setDay] = useState(days[0]);
  const { data: slots, isLoading } = useSlots(eventTypeId, day);

  const openSlots = (slots ?? []).filter((s) => s.available);

  const formatDay = (d: Date) =>
    d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {days.map((d) => {
          const isActive = d.toDateString() === day.toDateString();
          return (
            <Button
              key={d.toISOString()}
              type="button"
              variant={isActive ? "default" : "outline"}
              className="shrink-0"
              onClick={() => {
                setDay(d);
                onChange(null);
              }}
            >
              {formatDay(d)}
            </Button>
          );
        })}
      </div>

      <div>
        <p className="mb-2 text-sm text-muted-foreground">
          {formatDay(day)} — выберите время
        </p>
        {isLoading && <p className="text-sm text-muted-foreground">Загрузка…</p>}
        {!isLoading && openSlots.length === 0 && (
          <p className="text-sm text-muted-foreground">
            На этот день свободных слотов нет
          </p>
        )}
        {!isLoading && openSlots.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {openSlots.map((s) => {
              const selected = value === s.startAt;
              return (
                <Button
                  key={s.startAt}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  className={cn(selected && "ring-2 ring-ring ring-offset-1")}
                  onClick={() => onChange(selected ? null : s.startAt)}
                >
                  {formatTime(s.startAt)}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
