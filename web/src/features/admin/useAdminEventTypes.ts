import { useQuery } from "@tanstack/react-query";
import { adminListEventTypes } from "@/lib/api";

export function useAdminEventTypes() {
  return useQuery({
    queryKey: ["admin", "event-types"],
    queryFn: adminListEventTypes,
  });
}
