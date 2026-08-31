import { randomUUID } from "node:crypto";
import type { Booking, BookingCreateInput, EventType, EventTypeCreate } from "./types.js";

export class Store {
  private eventTypes = new Map<string, EventType>();
  private bookings = new Map<string, Booking>();

  listEventTypes(): EventType[] {
    return [...this.eventTypes.values()];
  }

  getEventType(id: string): EventType | undefined {
    return this.eventTypes.get(id);
  }

  createEventType(data: EventTypeCreate): EventType {
    const eventType: EventType = { id: randomUUID(), ...data };
    this.eventTypes.set(eventType.id, eventType);
    return eventType;
  }

  listBookings(): Booking[] {
    return [...this.bookings.values()];
  }

  createBooking(data: BookingCreateInput, endAt: string): Booking {
    const booking: Booking = {
      id: randomUUID(),
      eventTypeId: data.eventTypeId,
      guestName: data.guestName,
      startAt: new Date(Date.parse(data.startAt)).toISOString(),
      endAt,
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }
}
