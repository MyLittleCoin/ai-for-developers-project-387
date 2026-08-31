import type { APIRequestContext } from "@playwright/test";

export const BACKEND_URL = "http://localhost:4011";
export const STEP_MS = 30 * 60_000;

export interface SlotPlan {
  iso: string;
  label: string;
}

// slotTime(gap) reservation — keep gaps unique across ALL spec files so
// bookings never overlap in the shared in-memory backend store (workers:1).
// booking-flow:         1 (booked), 5 (Алиса), 6 (Боб), 9 (Марат), 10 (view)
// slot-conflict:        3 (Соперник, booked via API)
// guest-validation:     7, 8 (view only, never booked)
// app-navigation:       2 (day 2 view only), 11 (Расписание, booked via API)
// FUTURE TESTS: pick the next free gap (11+) or add a new row here.
//
// Gaps 1–10 are all reserved (gap 4 is left unused to keep the rows stable),
// so nextGap() hands out the first free gap (11) and reserves it.
const reservedGaps = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

// Returns the next gap not reserved above (11+) and reserves it.
export function nextGap(): number {
  let gap = 1;
  while (reservedGaps.has(gap)) {
    gap += 1;
  }
  reservedGaps.add(gap);
  return gap;
}

function utcLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export function slotTime(gap = 1): SlotPlan {
  const now = new Date();
  const dayStartUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const iso = new Date(dayStartUtc + 8 * 3600_000 + gap * STEP_MS).toISOString();
  return { iso, label: utcLabel(iso) };
}

export function dayButtonLabel(dayOffset = 1): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export async function seedEventType(
  request: APIRequestContext,
  name: string,
  description = "Описание",
  durationMinutes = 30,
): Promise<{ id: string; name: string }> {
  const res = await request.post(`${BACKEND_URL}/api/v1/admin/event-types`, {
    data: { name, description, durationMinutes },
  });
  if (!res.ok()) throw new Error(`seedEventType failed: ${res.status()} ${await res.text()}`);
  return (await res.json()) as { id: string; name: string };
}

export async function bookSlot(
  request: APIRequestContext,
  eventTypeId: string,
  guestName: string,
  startAt: string,
): Promise<{ id: string }> {
  const res = await request.post(`${BACKEND_URL}/api/v1/bookings`, {
    data: { eventTypeId, guestName, startAt },
  });
  if (!res.ok()) throw new Error(`bookSlot failed: ${res.status()} ${await res.text()}`);
  return (await res.json()) as { id: string };
}

export async function listBookings(request: APIRequestContext): Promise<unknown[]> {
  const res = await request.get(
    `${BACKEND_URL}/api/v1/admin/bookings?from=2000-01-01T00:00:00.000Z`,
  );
  if (!res.ok()) throw new Error(`listBookings failed: ${res.status()}`);
  return (await res.json()) as unknown[];
}
