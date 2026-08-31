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
});

describe("formatDuration", () => {
  it("formats durations under an hour as minutes", () => {
    expect(formatDuration(0)).toBe("0 мин");
    expect(formatDuration(30)).toBe("30 мин");
    expect(formatDuration(59)).toBe("59 мин");
  });

  it("formats whole hours as hours only", () => {
    expect(formatDuration(60)).toBe("1 ч");
    expect(formatDuration(120)).toBe("2 ч");
  });

  it("formats long durations as hours and minutes", () => {
    expect(formatDuration(90)).toBe("1 ч 30 мин");
    expect(formatDuration(125)).toBe("2 ч 5 мин");
  });
});
