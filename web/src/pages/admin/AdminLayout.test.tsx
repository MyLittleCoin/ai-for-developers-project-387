import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminLayout from "@/pages/admin/AdminLayout";

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<div>admin outlet</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminLayout", () => {
  it("links back to the guest view", () => {
    renderLayout();
    expect(screen.getByRole("link", { name: "К гостевому виду" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
