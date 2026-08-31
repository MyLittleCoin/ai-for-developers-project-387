import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { startOfDay } from "date-fns";
import DailyTimeline from "@/components/guest/DailyTimeline";
import type { Booking } from "@/lib/api";

function localISO(dayOffset: number, hour: number, minutes = 0) {
  const day = startOfDay(new Date());
  const d = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate() + dayOffset,
    hour,
    minutes,
  );
  return d.toISOString();
}

const day = startOfDay(new Date());

const meeting: Booking = {
  id: "b1",
  eventTypeId: "intro",
  guestName: "Аня",
  startAt: localISO(1, 10),
  endAt: localISO(1, 10, 30),
};

describe("DailyTimeline", () => {
  it("shows an hour grid spanning the meeting hours", () => {
    render(<DailyTimeline day={day} meetings={[meeting]} />);

    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("11:00")).toBeInTheDocument();
  });

  it("renders meeting blocks with guest, type and time range", () => {
    render(<DailyTimeline day={day} meetings={[meeting]} />);

    expect(screen.getByText("Аня")).toBeInTheDocument();
    expect(screen.getByText(/intro · 10:00 — 10:30/)).toBeInTheDocument();
  });

  it("shows an empty state when the day has no meetings", () => {
    render(<DailyTimeline day={day} meetings={[]} />);

    expect(screen.getByText("В этот день встреч нет")).toBeInTheDocument();
  });
});
