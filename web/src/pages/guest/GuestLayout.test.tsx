import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import GuestLayout from "@/pages/guest/GuestLayout";

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={<GuestLayout />}>
          <Route path="/" element={<div>home outlet</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("GuestLayout", () => {
  it("renders nav with home and schedule links", () => {
    renderLayout();
    expect(screen.getByRole("link", { name: "Главная" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Расписание" })).toHaveAttribute(
      "href",
      "/schedule",
    );
  });

  it("links to the owner mode", () => {
    renderLayout();
    expect(screen.getByRole("link", { name: "Владельцу" })).toHaveAttribute(
      "href",
      "/admin",
    );
  });
});
