import { describe, expect, it } from "vitest";
import { formatTime, formatDateTime, dayWindow, formatDuration } from "./dates";

describe("dates", () => {
  it("dayWindow returns 14 days starting from local midnight", () => {
    const now = new Date(2026, 7, 15, 13, 30);
    const { days, fromISO, toISO } = dayWindow(now, 14);
    expect(days).toHaveLength(14);
    expect(days[0].getHours()).toBe(0);
    expect(days[0].getMinutes()).toBe(0);
    const anchor = new Date(2026, 7, 15);
    expect(days[0].getTime()).toBe(anchor.getTime());
    const expectedTo = new Date(2026, 7, 29);
    expect(new Date(fromISO).getTime()).toBe(anchor.getTime());
    expect(new Date(toISO).getTime()).toBe(expectedTo.getTime());
  });

  it("formats time and datetime from ISO", () => {
    const iso = new Date(2026, 7, 16, 10, 0).toISOString();
    expect(formatTime(iso)).toBe("10:00");
    expect(formatDateTime(iso)).toBe("16.08.2026 10:00");
  });

  it("formats duration under an hour in minutes", () => {
    expect(formatDuration(0)).toBe("0 минут");
    expect(formatDuration(1)).toBe("1 минута");
    expect(formatDuration(30)).toBe("30 минут");
    expect(formatDuration(59)).toBe("59 минут");
  });

  it("formats duration of a whole number of hours", () => {
    expect(formatDuration(60)).toBe("1 час");
    expect(formatDuration(61)).toBe("1 час 1 минута");
    expect(formatDuration(120)).toBe("2 часа");
    expect(formatDuration(180)).toBe("3 часа");
    expect(formatDuration(300)).toBe("5 часов");
  });

  it("formats duration over an hour as hours and minutes", () => {
    expect(formatDuration(90)).toBe("1 час 30 минут");
    expect(formatDuration(150)).toBe("2 часа 30 минут");
    expect(formatDuration(125)).toBe("2 часа 5 минут");
    expect(formatDuration(24 * 60)).toBe("24 часа");
  });
});
