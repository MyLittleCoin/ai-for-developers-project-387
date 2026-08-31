import { expect, test } from "@playwright/test";
import { seedEventType, slotTime, dayButtonLabel, bookSlot, nextGap } from "../helpers";

test.describe("Навигация и краевые случаи", () => {
  test("несуществующий тип события — слотов нет (404 бэкенда)", async ({ page }) => {
    await page.goto("/book/00000000-0000-0000-0000-000000000000");
    await expect(
      page.getByText("На этот день свободных слотов нет"),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("переходы guest home и admin event-types рендерятся", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Сервис бронирования" }),
    ).toBeVisible();

    await page.goto("/admin/event-types");
    await expect(
      page.getByRole("heading", { name: "Типы событий" }),
    ).toBeVisible();
  });

  test("расписание гостя показывает встречи и есть переход в режим владельца", async ({
    page,
    request,
  }) => {
    const type = await seedEventType(request, "Расписание");
    const plan = slotTime(nextGap());
    await bookSlot(request, type.id, "Зритель", plan.iso);

    await page.goto("/");
    await page.getByRole("link", { name: "Расписание" }).click();
    await expect(
      page.getByRole("heading", { name: "Расписание" }),
    ).toBeVisible();
    await expect(page.getByText("Зритель")).toBeVisible();

    await page.getByRole("link", { name: "Владельцу" }).click();
    await expect(
      page.getByRole("heading", { name: "Типы событий" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "К гостевому виду" }).click();
    await expect(
      page.getByRole("heading", { name: "Сервис бронирования" }),
    ).toBeVisible();
  });

  test("неизвестный маршрут — страница 404", async ({ page }) => {
    await page.goto("/no/such/page");
    await expect(page.getByText("Страница не найдена")).toBeVisible();
  });

  test("прямой переход на success без state — редирект на главную", async ({
    page,
    request,
  }) => {
    const type = await seedEventType(request, "Нова Брон");
    await page.goto(`/book/${type.id}/success`);
    await expect(page.getByRole("heading", { name: "Сервис бронирования" })).toBeVisible();
  });

  test("навигация по дням — переключение дня загружает слоты", async ({
    page,
    request,
  }) => {
    const type = await seedEventType(request, "Навигатор");
    await page.goto(`/book/${type.id}`);

    const tomorrow = dayButtonLabel(1);
    await page
      .locator("div.mb-4.flex.gap-2")
      .getByRole("button", { name: tomorrow })
      .click();

    await expect(
      page.getByText(new RegExp(`^${tomorrow} — выберите время`)),
    ).toBeVisible();

    const plan = slotTime(2);
    await expect(page.getByRole("button", { name: plan.label })).toBeVisible();
  });
});
