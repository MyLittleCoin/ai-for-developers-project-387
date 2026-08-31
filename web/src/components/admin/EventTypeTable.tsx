import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { EventType } from "@/lib/api";

export default function EventTypeTable({ eventTypes }: { eventTypes: EventType[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Название</TableHead>
          <TableHead>Описание</TableHead>
          <TableHead className="w-24">Длительность</TableHead>
          <TableHead className="w-28 text-right">Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {eventTypes.map((et) => (
          <TableRow key={et.id}>
            <TableCell className="font-medium">{et.name}</TableCell>
            <TableCell className="text-muted-foreground">
              {et.description}
            </TableCell>
            <TableCell>{et.durationMinutes}</TableCell>
            <TableCell className="text-right">
              <Button asChild variant="outline" size="sm">
                <Link to={`/admin/event-types/${et.id}`}>Подробнее</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
