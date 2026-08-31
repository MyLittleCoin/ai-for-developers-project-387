import { useQuery } from "@tanstack/react-query";
import { adminGetEventType } from "@/lib/api";

export function useAdminEventType(eventTypeId: string) {
  return useQuery({
    queryKey: ["admin", "event-types", eventTypeId],
    queryFn: () => adminGetEventType(eventTypeId),
  });
}
