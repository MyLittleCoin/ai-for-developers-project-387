import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/dates";
import type { Booking } from "@/lib/api";

export default function BookingsTable({ bookings }: { bookings: Booking[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Гость</TableHead>
          <TableHead>Тип события</TableHead>
          <TableHead>Начало</TableHead>
          <TableHead>Конец</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((b) => (
          <TableRow key={b.id}>
            <TableCell className="font-medium">{b.guestName}</TableCell>
            <TableCell className="text-muted-foreground">
              {b.eventTypeId}
            </TableCell>
            <TableCell>{formatDateTime(b.startAt)}</TableCell>
            <TableCell>{formatDateTime(b.endAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
