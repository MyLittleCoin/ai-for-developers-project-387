import { useQuery } from "@tanstack/react-query";
import { listSlots } from "@/lib/api";

export function useSlots(eventTypeId: string, day: Date) {
  const dayISO = day.toISOString();
  const nextDayISO = new Date(day.getTime() + 24 * 60 * 60 * 1000).toISOString();

  return useQuery({
    queryKey: ["slots", eventTypeId, dayISO],
    queryFn: () => listSlots(eventTypeId, dayISO, nextDayISO),
  });
}
