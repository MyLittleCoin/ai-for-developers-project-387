import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import { useSchedule } from "@/features/guest/useSchedule";
import { dayWindow, formatStripDay } from "@/lib/dates";
import type { Booking } from "@/lib/api";
import CalendarStrip from "@/components/guest/CalendarStrip";
import DailyTimeline from "@/components/guest/DailyTimeline";

export default function SchedulePage() {
  const { data, isLoading, isError } = useSchedule();
  const { days } = dayWindow();
  const [selectedDay, setSelectedDay] = useState<Date>(days[0]);

  const meetings = data ?? [];
  const counts = meetings.reduce<Record<string, number>>((acc, m) => {
    const key = formatStripDay(new Date(m.startAt));
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const dayMeetings = meetings.filter(
    (m: Booking) =>
      formatStripDay(new Date(m.startAt)) === formatStripDay(selectedDay),
  );

  return (
    <div>
      <PageHeader
        title="Расписание"
        description="Встречи, запланированные гостем, в виде календаря"
      />
      {isLoading && <Skeleton className="h-48" />}
      {isError && <p className="text-destructive">Ошибка сервера</p>}
      {!isLoading && !isError && (
        <>
          <CalendarStrip
            days={days}
            counts={counts}
            selectedDay={selectedDay}
            onSelect={setSelectedDay}
          />
          <h2 className="mt-6 text-sm font-medium text-muted-foreground">
            {selectedDay.toLocaleDateString("ru-RU", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h2>
          <DailyTimeline day={selectedDay} meetings={dayMeetings} />
        </>
      )}
    </div>
  );
}
