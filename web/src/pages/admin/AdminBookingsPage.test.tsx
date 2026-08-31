import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminBookingsPage from "@/pages/admin/AdminBookingsPage";

vi.mock("@/lib/api", () => ({
  adminListBookings: vi.fn(),
}));

import { adminListBookings } from "@/lib/api";
import type { Booking } from "@/lib/api";

const listMock = vi.mocked(adminListBookings);

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminBookingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const bookings: Booking[] = [
  {
    id: "b1",
    eventTypeId: "intro",
    guestName: "Иван",
    startAt: "2026-08-16T10:00:00.000Z",
    endAt: "2026-08-16T10:30:00.000Z",
  },
];

describe("AdminBookingsPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders upcoming bookings in a table", async () => {
    listMock.mockResolvedValue(bookings);
    renderPage();
    expect(await screen.findByText("Иван")).toBeInTheDocument();
    expect(screen.getByText("intro")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    listMock.mockResolvedValue([]);
    renderPage();
    expect(
      await screen.findByText("Ближайших встреч нет"),
    ).toBeInTheDocument();
  });
});
