import { useQuery } from "@tanstack/react-query";
import { listMeetings } from "@/lib/api";

export function useSchedule() {
  return useQuery({
    queryKey: ["meetings"],
    queryFn: () => listMeetings(new Date().toISOString()),
    refetchInterval: 60_000,
  });
}
