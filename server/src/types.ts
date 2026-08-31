export interface EventType {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface EventTypeCreate {
  name: string;
  description: string;
  durationMinutes: number;
}

export interface Slot {
  eventTypeId: string;
  startAt: string;
  endAt: string;
  available: boolean;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  guestName: string;
  startAt: string;
  endAt: string;
}

export interface BookingCreateInput {
  eventTypeId: string;
  guestName: string;
  startAt: string;
}
