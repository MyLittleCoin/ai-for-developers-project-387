import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBooking, type BookingCreate } from "@/lib/api";
import { ApiError } from "@/lib/errors";

export function useCreateBooking() {
  const queryClient = useQueryClient();

  const invalidateSlots = () => {
    queryClient.invalidateQueries({ queryKey: ["slots"] });
  };

  return useMutation({
    mutationFn: (body: BookingCreate) => createBooking(body),
    onSuccess: () => invalidateSlots(),
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        invalidateSlots();
      }
    },
  });
}
