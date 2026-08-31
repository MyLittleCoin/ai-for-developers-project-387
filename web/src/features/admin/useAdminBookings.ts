import { useQuery } from "@tanstack/react-query";
import { adminListBookings } from "@/lib/api";

export function useAdminBookings() {
  return useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: () => adminListBookings(new Date().toISOString()),
    refetchInterval: 60_000,
  });
}
