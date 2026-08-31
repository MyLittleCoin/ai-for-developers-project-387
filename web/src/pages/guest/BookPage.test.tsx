import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { startOfDay } from "date-fns";
import BookPage from "@/pages/guest/BookPage";
import { ApiError } from "@/lib/errors";
import { Toaster } from "@/components/ui/sonner";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  listSlots: vi.fn(),
  createBooking: vi.fn(),
  listEventTypes: vi.fn(),
}));

import { listSlots, createBooking, listEventTypes } from "@/lib/api";
import type { Slot } from "@/lib/api";

const slotsMock = vi.mocked(listSlots);
const bookMock = vi.mocked(createBooking);
const typesMock = vi.mocked(listEventTypes);

function localISO(hour: number) {
  const day = startOfDay(new Date());
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hour,
    0,
    0,
  ).toISOString();
}

const available: Slot = {
  eventTypeId: "intro",
  startAt: localISO(10),
  endAt: localISO(10.5),
  available: true,
};

const busy: Slot = {
  eventTypeId: "intro",
  startAt: localISO(11),
  endAt: localISO(11.5),
  available: false,
};

function SuccessProbe() {
  const location = useLocation();
  return <div>success:{location.state?.booking?.guestName ?? "none"}</div>;
}

function renderFlow() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/book/intro"]}>
        <Toaster />
        <Routes>
          <Route path="/book/:eventTypeId" element={<BookPage />} />
          <Route
            path="/book/:eventTypeId/success"
            element={<SuccessProbe />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function getTimeButton(time: string) {
  return screen.getByRole("button", { name: time });
}

describe("Slot booking flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    typesMock.mockResolvedValue([{ id: "intro", name: "Вводная встреча", description: "", durationMinutes: 30 }]);
  });

  it("shows busy slot as disabled and books an available slot", async () => {
    slotsMock.mockResolvedValue([available, busy]);
    bookMock.mockResolvedValue({
      id: "b1",
      eventTypeId: "intro",
      guestName: "Иван",
      startAt: available.startAt,
      endAt: available.endAt,
    });

    renderFlow();
    await screen.findByRole("button", { name: "10:00" });

    expect(screen.queryByRole("button", { name: "11:00" })).toBeNull();

    await userEvent.click(getTimeButton("10:00"));
    await userEvent.type(screen.getByLabelText(/имя/i), "Иван");
    await userEvent.click(screen.getByRole("button", { name: /записаться/i }));

    await waitFor(() =>
      expect(bookMock).toHaveBeenCalledWith({
        eventTypeId: "intro",
        guestName: "Иван",
        startAt: available.startAt,
      }),
    );
    expect(await screen.findByText("success:Иван")).toBeInTheDocument();
  });

  it("requires selecting a slot before booking", async () => {
    slotsMock.mockResolvedValue([available]);
    renderFlow();
    await screen.findByRole("button", { name: "10:00" });

    await userEvent.type(screen.getByLabelText(/имя/i), "Иван");
    await userEvent.click(screen.getByRole("button", { name: /записаться/i }));

    expect(bookMock).not.toHaveBeenCalled();
    const toasts = await screen.findAllByText(/сначала выберите слот/i);
    expect(toasts.length).toBeGreaterThan(0);
  });

  it("shows conflict toast and removes a freshly booked slot from the list", async () => {
    slotsMock.mockResolvedValueOnce([available]).mockResolvedValue([]);
    bookMock.mockRejectedValue(new ApiError(409, "slot_conflict", "занят"));

    renderFlow();
    await screen.findByRole("button", { name: "10:00" });

    await userEvent.click(getTimeButton("10:00"));
    await userEvent.type(screen.getByLabelText(/имя/i), "Иван");
    await userEvent.click(screen.getByRole("button", { name: /записаться/i }));

    expect(bookMock).toHaveBeenCalled();
    const toasts = await screen.findAllByText("Слот уже занят");
    expect(toasts.length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "10:00" })).toBeNull();
  });
});
