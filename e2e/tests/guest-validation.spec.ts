import { expect, test } from "@playwright/test";
import { seedEventType, listBookings, slotTime } from "../helpers";

test.describe("Валидация брони", () => {
  test("без выбранного слота — тост и POST не уходит", async ({ page, request }) => {
    const type = await seedEventType(request, "Созвон V");
    await page.goto(`/book/${type.id}`);
    await page.getByLabel(/имя/).fill("Гость");
    await page.getByRole("button", { name: "Записаться" }).click();

    await expect(page.getByText("Сначала выберите слот")).toBeVisible();
    const own = (await listBookings(request)).filter(
      (b) => (b as { eventTypeId: string }).eventTypeId === type.id,
    );
    expect(own).toHaveLength(0);
  });

  test("пустое имя — текст ошибки и POST не уходит", async ({ page, request }) => {
    const type = await seedEventType(request, "Созвон V2");
    const plan = slotTime(7);
    await page.goto(`/book/${type.id}`);
    await page.getByRole("button", { name: plan.label }).first().click();
    await page.getByRole("button", { name: "Записаться" }).click();

    await expect(page.getByText("Укажите имя")).toBeVisible();
    const own = (await listBookings(request)).filter(
      (b) => (b as { eventTypeId: string }).eventTypeId === type.id,
    );
    expect(own).toHaveLength(0);
  });

  test("имя длиннее 200 символов — текст ошибки, POST не уходит", async ({
    page,
    request,
  }) => {
    const type = await seedEventType(request, "Созвон V3");
    const plan = slotTime(8);
    await page.goto(`/book/${type.id}`);
    await page.getByRole("button", { name: plan.label }).first().click();
    await page.getByLabel(/имя/).fill("а".repeat(201));
    await page.getByRole("button", { name: "Записаться" }).click();

    await expect(page.getByText("Имя не длиннее 200 символов")).toBeVisible();
    const own = (await listBookings(request)).filter(
      (b) => (b as { eventTypeId: string }).eventTypeId === type.id,
    );
    expect(own).toHaveLength(0);
  });
});
