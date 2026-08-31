import { Link, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import { useAdminEventType } from "@/features/admin/useAdminEventType";
import { formatDuration } from "@/lib/dates";

export default function AdminEventTypeDetailPage() {
  const { eventTypeId = "" } = useParams();
  const { data, isLoading, isError } = useAdminEventType(eventTypeId);

  return (
    <div>
      <PageHeader
        title="Тип события"
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/event-types">← Ко всем типам</Link>
          </Button>
        }
      />
      {isLoading && <Skeleton className="h-32" />}
      {isError && <p className="text-destructive">Не найдено</p>}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>{data.name}</CardTitle>
            {data.description && (
              <CardDescription>{data.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Длительность: {formatDuration(data.durationMinutes)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              ID: {data.id}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
