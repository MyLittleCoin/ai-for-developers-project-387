import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import EventTypeTable from "@/components/admin/EventTypeTable";
import EventTypeFormDialog from "@/components/admin/EventTypeFormDialog";
import { useAdminEventTypes } from "@/features/admin/useAdminEventTypes";

export default function AdminEventTypesPage() {
  const { data, isLoading, isError } = useAdminEventTypes();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Типы событий"
        description="Виды записей, которые видят гости"
        actions={
          <Button onClick={() => setDialogOpen(true)}>Создать</Button>
        }
      />

      {isLoading && <Skeleton className="h-48" />}
      {isError && <p className="text-destructive">Ошибка сервера</p>}
      {data && data.length === 0 && (
        <p className="text-muted-foreground">
          Типов событий пока нет. Создайте первый.
        </p>
      )}
      {data && data.length > 0 && <EventTypeTable eventTypes={data} />}

      <EventTypeFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
