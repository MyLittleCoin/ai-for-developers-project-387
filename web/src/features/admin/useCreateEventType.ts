import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCreateEventType, type EventTypeCreate } from "@/lib/api";

export function useCreateEventType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: EventTypeCreate) => adminCreateEventType(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "event-types"] });
    },
  });
}
