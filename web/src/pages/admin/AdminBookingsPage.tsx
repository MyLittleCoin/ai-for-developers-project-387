import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import BookingsTable from "@/components/admin/BookingsTable";
import { useAdminBookings } from "@/features/admin/useAdminBookings";

export default function AdminBookingsPage() {
  const { data, isLoading, isError } = useAdminBookings();

  return (
    <div>
      <PageHeader
        title="Встречи"
        description="Предстоящие бронирования всех типов событий"
      />
      {isLoading && <Skeleton className="h-48" />}
      {isError && <p className="text-destructive">Ошибка сервера</p>}
      {data && data.length === 0 && (
        <p className="text-muted-foreground">Ближайших встреч нет</p>
      )}
      {data && data.length > 0 && <BookingsTable bookings={data} />}
    </div>
  );
}
