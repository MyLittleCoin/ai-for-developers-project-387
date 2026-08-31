import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminEventTypesPage from "@/pages/admin/AdminEventTypesPage";

vi.mock("@/lib/api", () => ({
  adminListEventTypes: vi.fn(),
  adminCreateEventType: vi.fn(),
}));

import { adminListEventTypes, adminCreateEventType } from "@/lib/api";
import type { EventType } from "@/lib/api";

const listMock = vi.mocked(adminListEventTypes);
const createMock = vi.mocked(adminCreateEventType);

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminEventTypesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const types: EventType[] = [
  {
    id: "intro",
    name: "Вводная встреча",
    description: "Знакомство",
    durationMinutes: 30,
  },
  {
    id: "workshop",
    name: "Воркшоп",
    description: "Глубокая проработка",
    durationMinutes: 90,
  },
];

describe("AdminEventTypesPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a table of event types", async () => {
    listMock.mockResolvedValue(types);
    renderPage();
    expect(await screen.findByText("Вводная встреча")).toBeInTheDocument();
    expect(screen.getByText("Знакомство")).toBeInTheDocument();
    expect(screen.getByText("30 минут")).toBeInTheDocument();
    expect(screen.getByText("Воркшоп")).toBeInTheDocument();
    expect(screen.getByText("1 час 30 минут")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /подробнее/i })).toHaveLength(2);
  });

  it("creates an event type and refreshes the list", async () => {
    listMock.mockResolvedValueOnce([]).mockResolvedValue(types);
    createMock.mockResolvedValue(types[0]);

    renderPage();
    await userEvent.click(
      await screen.findByRole("button", { name: /создать/i }),
    );

    await userEvent.type(screen.getByLabelText(/название/i), "Вводная встреча");
    await userEvent.type(
      screen.getByLabelText(/описание/i),
      "Знакомство",
    );
    await userEvent.clear(screen.getByLabelText(/длительность/i));
    await userEvent.type(screen.getByLabelText(/длительность/i), "30");
    await userEvent.click(screen.getByRole("button", { name: /сохранить/i }));

    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith({
        name: "Вводная встреча",
        description: "Знакомство",
        durationMinutes: 30,
      }),
    );
    expect(await screen.findByText("Вводная встреча")).toBeInTheDocument();
  });

  it("validates empty name", async () => {
    listMock.mockResolvedValue([]);
    renderPage();
    await userEvent.click(
      await screen.findByRole("button", { name: /создать/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /сохранить/i }));
    expect(await screen.findByText(/укажите название/i)).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });
});
