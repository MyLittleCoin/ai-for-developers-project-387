import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import SlotPicker from "@/components/guest/SlotPicker";
import BookingForm from "@/components/guest/BookingForm";
import { useEventTypes } from "@/features/guest/useEventTypes";
import { useCreateBooking } from "@/features/guest/useCreateBooking";
import { errorToMessage } from "@/lib/errors";

export default function BookPage() {
  const { eventTypeId = "" } = useParams();
  const navigate = useNavigate();
  const [startAt, setStartAt] = useState<string | null>(null);
  const mutation = useCreateBooking();
  const { data: eventTypes } = useEventTypes();
  const eventType = eventTypes?.find((et) => et.id === eventTypeId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader
        title={eventType?.name ?? "Выбор времени"}
        description={eventType?.description || "Выберите день и свободный слот"}
      />

      <SlotPicker eventTypeId={eventTypeId} value={startAt} onChange={setStartAt} />

      <div className="mt-8 border-t pt-6">
        <BookingForm
          isPending={mutation.isPending}
          onSubmit={(guestName) => {
            if (!startAt) {
              toast("Сначала выберите слот");
              return;
            }
            mutation.mutate(
              { eventTypeId, guestName, startAt },
              {
                onSuccess: (booking) =>
                  navigate(`/book/${eventTypeId}/success`, {
                    state: { booking },
                  }),
                onError: (err) => toast(errorToMessage(err)),
              },
            );
          }}
        />
      </div>

      <div className="mt-6">
        <Button asChild variant="ghost" size="sm">
          <a href="/">← К типам встреч</a>
        </Button>
      </div>
    </div>
  );
}
