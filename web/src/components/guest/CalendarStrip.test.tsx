import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDays, startOfDay } from "date-fns";
import { formatStripDay } from "@/lib/dates";
import CalendarStrip from "@/components/guest/CalendarStrip";

function makeDays(count: number, from = startOfDay(new Date())) {
  return Array.from({ length: count }, (_, i) => addDays(from, i));
}

describe("CalendarStrip", () => {
  const today = startOfDay(new Date());
  const days = makeDays(14);
  const tomorrow = addDays(today, 1);
  const key = (d: Date) => formatStripDay(d);

  it("renders one tile per day", () => {
    render(
      <CalendarStrip
        days={days}
        counts={{}}
        selectedDay={today}
        onSelect={() => {}}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(14);
  });

  it("shows a badge with the meeting count on a day", () => {
    render(
      <CalendarStrip
        days={days}
        counts={{ [key(tomorrow)]: 2 }}
        selectedDay={today}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByLabelText("2 встреч")).toBeInTheDocument();
  });

  it("does not show a badge when a day has no meetings", () => {
    render(
      <CalendarStrip
        days={[today, tomorrow]}
        counts={{}}
        selectedDay={today}
        onSelect={() => {}}
      />,
    );

    expect(screen.queryByLabelText(/встреч/)).not.toBeInTheDocument();
  });

  it("marks the selected day as pressed", () => {
    render(
      <CalendarStrip
        days={[today, tomorrow]}
        counts={{}}
        selectedDay={tomorrow}
        onSelect={() => {}}
      />,
    );

    const tiles = screen.getAllByRole("button");
    expect(tiles[1]).toHaveAttribute("aria-pressed", "true");
    expect(tiles[0]).toHaveAttribute("aria-pressed", "false");
  });

  it("notifies the selected day on click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <CalendarStrip
        days={[today, tomorrow]}
        counts={{}}
        selectedDay={today}
        onSelect={onSelect}
      />,
    );

    const tiles = screen.getAllByRole("button");
    await user.click(tiles[1]);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(tomorrow);
  });
});
