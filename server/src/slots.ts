import type { Slot } from "./types.js";

export const SLOT_STEP_MINUTES = 30;
export const BOOKING_WINDOW_DAYS = 14;

export interface BookingInterval {
  startAt: string;
  endAt: string;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function bookingWindow(now = new Date()): { start: Date; end: Date } {
  const start = startOfDay(now);
  const end = new Date(start);
  end.setDate(end.getDate() + BOOKING_WINDOW_DAYS);
  return { start, end };
}

export function nextSlotBoundary(time: Date): Date {
  const stepMs = SLOT_STEP_MINUTES * 60_000;
  const ms = Math.ceil(time.getTime() / stepMs) * stepMs;
  return new Date(ms);
}

export function computeSlots(
  eventTypeId: string,
  durationMinutes: number,
  from: Date,
  to: Date,
  bookings: BookingInterval[],
): Slot[] {
  const stepMs = SLOT_STEP_MINUTES * 60_000;
  const durationMs = durationMinutes * 60_000;
  const limit = to.getTime();
  const slots: Slot[] = [];
  let start = nextSlotBoundary(from).getTime();

  while (start < limit) {
    const end = start + durationMs;
    const available = !bookings.some(
      (b) => Date.parse(b.startAt) < end && Date.parse(b.endAt) > start,
    );
    slots.push({
      eventTypeId,
      startAt: new Date(start).toISOString(),
      endAt: new Date(end).toISOString(),
      available,
    });
    start += stepMs;
  }

  return slots;
}
