import { expect, test } from "@playwright/test";
import { bookSlot, seedEventType, slotTime } from "../helpers";

test.describe("Полный путь бронирования", () => {
  test("админ создаёт тип через UI → гость бронирует → бронь видна в админке", async ({
    page,
  }) => {
    await page.goto("/admin/event-types");
    await page.getByRole("button", { name: "Создать" }).click();

    await page.getByLabel("Название").fill("Консультация");
    await page.getByLabel("Описание").fill("Разбор вопросов");
    await page.getByLabel("Длительность, минут").fill("30");
    await page.getByRole("button", { name: "Сохранить" }).click();

    await expect(page.getByRole("table")).toContainText("Консультация");

    await page.goto("/");
    const konsultCard = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("Консультация", { exact: true }) });
    await konsultCard.getByRole("link", { name: "Выбрать время" }).click();
    await expect(
      page.getByRole("heading", { name: "Консультация" }),
    ).toBeVisible();

    const plan = slotTime(1);
    await page.getByRole("button", { name: plan.label }).first().click();
    await page.getByLabel(/имя/).fill("Иван");
    await page.getByRole("button", { name: "Записаться" }).click();

    await expect(
      page.getByRole("heading", { name: "Вы записаны!" }),
    ).toBeVisible();

    await page.goto("/admin/bookings");
    await expect(page.getByRole("table")).toContainText("Иван");
  });

  test("два гостя бронируют разные слоты одного типа; обе брони в админке", async ({
    page,
    request,
  }) => {
    const type = await seedEventType(request, "Консультация 2");
    const slotA = slotTime(5);
    const slotB = slotTime(6);

    async function book(name: string, plan: { label: string }) {
      await page.goto(`/book/${type.id}`);
      await page.getByRole("button", { name: plan.label }).first().click();
      await page.getByLabel(/имя/).fill(name);
      await page.getByRole("button", { name: "Записаться" }).click();
      await expect(
        page.getByRole("heading", { name: "Вы записаны!" }),
      ).toBeVisible();
    }

    await book("Алиса", slotA);
    await book("Боб", slotB);

    await page.goto("/admin/bookings");
    const table = page.getByRole("table");
    await expect(table).toContainText("Алиса");
    await expect(table).toContainText("Боб");
  });

  test("после чужой брони слот не выбирается (disabled/скрыт)", async ({
    page,
    request,
  }) => {
    const type = await seedEventType(request, "Консультация 3");
    const plan = slotTime(9);
    await bookSlot(request, type.id, "Марат", plan.iso);

    await page.goto(`/book/${type.id}`);
    await expect(page.getByRole("button", { name: plan.label })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: slotTime(10).label }),
    ).toBeVisible();
  });
});
