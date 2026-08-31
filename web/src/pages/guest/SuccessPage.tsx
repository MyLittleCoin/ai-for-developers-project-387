import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/dates";
import type { Booking } from "@/lib/api";

export default function SuccessPage() {
  const location = useLocation();
  const { eventTypeId = "" } = useParams();
  const booking = (location.state as { booking?: Booking } | null)?.booking;

  if (!booking) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Вы записаны!</h1>
      <p className="mt-3 text-muted-foreground">
        {booking.guestName}, ваша встреча запланирована на{" "}
        {formatDateTime(booking.startAt)}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild>
          <Link to="/">На главную</Link>
        </Button>
        {eventTypeId && (
          <Button asChild variant="outline">
            <Link to={`/book/${eventTypeId}`}>Другая запись</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
