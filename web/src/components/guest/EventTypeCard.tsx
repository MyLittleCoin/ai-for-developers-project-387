import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EventType } from "@/lib/api";
import { formatDuration } from "@/lib/dates";

export default function EventTypeCard({ eventType }: { eventType: EventType }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle>{eventType.name}</CardTitle>
        {eventType.description && (
          <CardDescription>{eventType.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          {formatDuration(eventType.durationMinutes)}
        </span>
        <Button asChild variant="outline">
          <Link to={`/book/${eventType.id}`}>Выбрать время</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
