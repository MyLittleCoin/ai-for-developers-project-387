import { useQuery } from "@tanstack/react-query";
import { listEventTypes } from "@/lib/api";

export function useEventTypes() {
  return useQuery({ queryKey: ["event-types"], queryFn: listEventTypes });
}
