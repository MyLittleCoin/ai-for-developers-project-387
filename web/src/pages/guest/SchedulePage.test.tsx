import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { startOfDay } from "date-fns";
import SchedulePage from "@/pages/guest/SchedulePage";
import { formatStripDay } from "@/lib/dates";

vi.mock("@/lib/api", () => ({
  listMeetings: vi.fn(),
}));

import { listMeetings } from "@/lib/api";
import type { Booking } from "@/lib/api";

const listMock = vi.mocked(listMeetings);

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <SchedulePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function localISO(dayOffset: number, hour: number, minutes = 0) {
  const offsetDay = new Date();
  offsetDay.setDate(offsetDay.getDate() + dayOffset);
  offsetDay.setHours(hour, minutes, 0, 0);
  return offsetDay.toISOString();
}

function tomorrow() {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() + 1);
  return d;
}

const meetings: Booking[] = [
  {
    id: "b1",
    eventTypeId: "intro",
    guestName: "Аня",
    startAt: localISO(0, 10),
    endAt: localISO(0, 10, 30),
  },
  {
    id: "b2",
    eventTypeId: "consult",
    guestName: "Пётр",
    startAt: localISO(1, 14),
    endAt: localISO(1, 15),
  },
];

describe("SchedulePage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a calendar strip with 14 day tiles", async () => {
    listMock.mockResolvedValue(meetings);
    renderPage();

    expect(await screen.findAllByRole("button")).toHaveLength(14);
  });

  it("shows the meetings of the default (today) day in the timeline", async () => {
    listMock.mockResolvedValue(meetings);
    renderPage();

    expect(await screen.findByText("Аня")).toBeInTheDocument();
    expect(screen.getByText(/intro · 10:00 — 10:30/)).toBeInTheDocument();
  });

  it("shows a different day's meetings after selecting its tile", async () => {
    listMock.mockResolvedValue(meetings);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Аня");
    await user.click(
      screen.getByRole("button", { name: formatStripDay(tomorrow()) }),
    );

    expect(await screen.findByText("Пётр")).toBeInTheDocument();
    expect(screen.getByText(/consult · 14:00 — 15:00/)).toBeInTheDocument();
    expect(screen.queryByText("Аня")).not.toBeInTheDocument();
  });

  it("shows day badges with meeting counts", async () => {
    listMock.mockResolvedValue(meetings);
    renderPage();

    expect(await screen.findAllByLabelText("1 встреча")).toHaveLength(2);
  });

  it("marks today's tile as selected by default", async () => {
    listMock.mockResolvedValue(meetings);
    renderPage();

    const today = await screen.findByRole("button", {
      name: formatStripDay(startOfDay(new Date())),
    });
    expect(today).toHaveAttribute("aria-pressed", "true");
  });

  it("shows an empty state when the day has no meetings", async () => {
    listMock.mockResolvedValue([]);
    renderPage();

    expect(
      await screen.findByText("В этот день встреч нет"),
    ).toBeInTheDocument();
  });

  it("shows error state on failure", async () => {
    listMock.mockRejectedValue(new Error("boom"));
    renderPage();
    expect(await screen.findByText("Ошибка сервера")).toBeInTheDocument();
  });
});
