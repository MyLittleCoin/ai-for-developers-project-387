import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import EventTypeCard from "@/components/guest/EventTypeCard";
import { useEventTypes } from "@/features/guest/useEventTypes";

export default function HomePage() {
  const { data, isLoading, isError } = useEventTypes();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        title="Сервис бронирования"
        description="Выберите тип встречи и удобное время"
      />
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      )}
      {isError && <p className="text-destructive">Ошибка сервера</p>}
      {data && data.length === 0 && (
        <p className="text-muted-foreground">Типов событий пока нет</p>
      )}
      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((et) => (
            <EventTypeCard key={et.id} eventType={et} />
          ))}
        </div>
      )}
    </div>
  );
}
