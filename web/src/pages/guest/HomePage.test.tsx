import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "@/pages/guest/HomePage";

vi.mock("@/lib/api", () => ({
  listEventTypes: vi.fn(),
}));

import { listEventTypes } from "@/lib/api";
import type { EventType } from "@/lib/api";

const listMock = vi.mocked(listEventTypes);

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const types: EventType[] = [
  {
    id: "intro",
    name: "Вводная встреча",
    description: "Знакомство и обзор проекта",
    durationMinutes: 30,
  },
  {
    id: "consult",
    name: "Консультация",
    description: "Разбор вопросов по работе",
    durationMinutes: 60,
  },
  {
    id: "workshop",
    name: "Воркшоп",
    description: "Глубокая проработка темы",
    durationMinutes: 90,
  },
];

describe("HomePage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders event types as cards with links to booking", async () => {
    listMock.mockResolvedValue(types);
    renderPage();

    expect(await screen.findByText("Вводная встреча")).toBeInTheDocument();
    expect(screen.getByText("Знакомство и обзор проекта")).toBeInTheDocument();
    expect(screen.getByText("30 минут")).toBeInTheDocument();
    expect(screen.getByText("1 час")).toBeInTheDocument();
    expect(screen.getByText("Воркшоп")).toBeInTheDocument();
    expect(screen.getByText("1 час 30 минут")).toBeInTheDocument();

    const link = screen
      .getAllByRole("link", { name: /выбрать время/i })[0]
      .closest("a");
    expect(link).toHaveAttribute("href", "/book/intro");
  });

  it("shows empty state without event types", async () => {
    listMock.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText("Типов событий пока нет")).toBeInTheDocument();
  });

  it("shows error state on failure", async () => {
    listMock.mockRejectedValue(new Error("boom"));
    renderPage();
    expect(await screen.findByText("Ошибка сервера")).toBeInTheDocument();
  });
});
