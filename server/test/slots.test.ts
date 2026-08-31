import { describe, expect, test } from "vitest";
import {
  bookingWindow,
  BOOKING_WINDOW_DAYS,
  computeSlots,
  nextSlotBoundary,
} from "../src/slots.js";

describe("nextSlotBoundary", () => {
  test("не сдвигает уже выровненное время", () => {
    expect(nextSlotBoundary(new Date("2026-08-10T01:30:00.000Z")).toISOString()).toBe(
      "2026-08-10T01:30:00.000Z",
    );
  });

  test("округляет вверх до ближайшей 30-минутной границы", () => {
    expect(nextSlotBoundary(new Date("2026-08-10T00:07:00.000Z")).toISOString()).toBe(
      "2026-08-10T00:30:00.000Z",
    );
  });
});

describe("computeSlots", () => {
  const bookings: Array<{ startAt: string; endAt: string }> = [];

  test("генерирует 30-минутную сетку от from до to", () => {
    const slots = computeSlots(
      "et1",
      60,
      new Date("2026-08-10T00:00:00.000Z"),
      new Date("2026-08-10T02:00:00.000Z"),
      bookings,
    );
    expect(slots.map((s) => s.startAt)).toEqual([
      "2026-08-10T00:00:00.000Z",
      "2026-08-10T00:30:00.000Z",
      "2026-08-10T01:00:00.000Z",
      "2026-08-10T01:30:00.000Z",
    ]);
    expect(slots[0]).toMatchObject({
      eventTypeId: "et1",
      endAt: "2026-08-10T01:00:00.000Z",
      available: true,
    });
  });

  test("округляет невыровненный from вверх", () => {
    const slots = computeSlots(
      "et1",
      30,
      new Date("2026-08-10T00:07:00.000Z"),
      new Date("2026-08-10T00:40:00.000Z"),
      bookings,
    );
    expect(slots.map((s) => s.startAt)).toEqual(["2026-08-10T00:30:00.000Z"]);
  });

  test("не создаёт слоты, начинающиеся за пределами to", () => {
    const slots = computeSlots(
      "et1",
      30,
      new Date("2026-08-10T01:00:00.000Z"),
      new Date("2026-08-10T01:30:00.000Z"),
      bookings,
    );
    expect(slots).toHaveLength(1);
  });

  test("помечает слот занятым при перекрытии брони любого типа", () => {
    const slots = computeSlots(
      "et1",
      30,
      new Date("2026-08-10T00:00:00.000Z"),
      new Date("2026-08-10T01:30:00.000Z"),
      [
        { startAt: "2026-08-10T00:30:00.000Z", endAt: "2026-08-10T01:30:00.000Z" },
      ],
    );
    expect(slots.map((s) => s.available)).toEqual([true, false, false]);
  });

  test("соседние слоты встык не конфликтуют (полуоткрытые интервалы)", () => {
    const slots = computeSlots(
      "et1",
      30,
      new Date("2026-08-10T01:00:00.000Z"),
      new Date("2026-08-10T02:00:00.000Z"),
      [{ startAt: "2026-08-10T00:30:00.000Z", endAt: "2026-08-10T01:00:00.000Z" }],
    );
    expect(slots.map((s) => s.available)).toEqual([true, true]);
  });
});

describe("bookingWindow", () => {
  test("окно — 14 дней от начала текущего дня", () => {
    const now = new Date("2026-08-10T15:30:00.000Z");
    const { start, end } = bookingWindow(now);
    expect(end.getTime() - start.getTime()).toBe(BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    expect(start.getTime()).toBeLessThanOrEqual(now.getTime());
  });
});
