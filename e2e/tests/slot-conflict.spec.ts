import { expect, test } from "@playwright/test";
import { seedEventType, bookSlot, listBookings, slotTime } from "../helpers";

test.describe("Конфликт слота", () => {
  test("второй гость получает 409, слот убирается из доступных", async ({
    page,
    request,
  }) => {
    const type = await seedEventType(request, "Созвон");
    const plan = slotTime(3);

    await page.goto(`/book/${type.id}`);
    const slotButton = page.getByRole("button", { name: plan.label }).first();
    await expect(slotButton).toBeVisible();

    await bookSlot(request, type.id, "Соперник", plan.iso);

    await slotButton.click();
    await page.getByLabel(/имя/).fill("Гость B");
    await page.getByRole("button", { name: "Записаться" }).click();

    await expect(page.getByText("Слот уже занят")).toBeVisible();
    await expect(
      page.getByRole("button", { name: plan.label }),
    ).toHaveCount(0);

    const bookings = (await listBookings(request)).filter(
      (b) => (b as { eventTypeId: string }).eventTypeId === type.id,
    );
    expect(bookings).toHaveLength(1);
    expect(bookings[0]).toMatchObject({ guestName: "Соперник" });
  });
});
