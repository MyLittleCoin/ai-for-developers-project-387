# E2E (Playwright) + CI + release-please — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить отдельный пакет `e2e/` с Playwright-тестами пользовательских сценариев (полный флоу бронирования + краевые), CI-воркфлоу (unit+build+lint+e2e) и release-please-action по Conventional Commits.

**Architecture:** e2e — изолированный пакет `e2e/` (Playwright), запускает реальные `server/` (Fastify, :4011) и `web/` (Vite, :5173) через `webServer` с `TZ=UTC` и браузером в таймзоне UTC (детерминизм слотов). CI — три параллельных джоба. release-please (`release-type: simple`) создаёт release-PR на push в `main`.

**Tech Stack:** @playwright/test (^1.62), Node >= 20 (в env v26), GitHub Actions, googleapis/release-please-action@v4.

**Spec:** `docs/superpowers/specs/2026-08-16-e2e-ci-release-design.md`

## Global Constraints

- Коммиты — строго Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`, `refactor:`, `perf:`, `build:`, `revert:`; опциональный scope).
- Не трогать `.github/workflows/hexlet-check.yml`.
- Не менять контракт `main.tsp` и логику backend/frontend (только добавление `"start"` в `server/package.json`).
- `workers: 1` в Playwright-конфиге (общий in-memory store бэкенда — параллельность вызовет гонки).
- Все времена в эмуляции: UTC.
- Тексты интерфейса — русские (совпадают с приложением).

---

### Task 1: Каркас пакета `e2e/` и запуск бэкенда без watch

**Files:**
- Modify: `server/package.json` (добавить `"start": "tsx src/index.ts"`)
- Create: `e2e/package.json`, `e2e/playwright.config.ts`, `e2e/helpers.ts`, `e2e/.oxlintrc.json`, `e2e/tsconfig.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces:
  - `e2e/helpers.ts`:
    - `seedEventType(request, name): Promise<{ id: string; name: string }>`
    - `bookSlot(request, eventTypeId, guestName, startAt): Promise<{ id: string }>`
    - `slotLabel(iso): string` — «HH:mm» в UTC
    - `slotTime(gap = 0): { iso: string; label: string; dayOffset: number }` — слот через `gap` 30-мин шагов от следующей границы, label для кнопки
    - `dayButtonLabel(day): string` — метка кнопки дня (как в SlotPicker)
  - `e2e.DIR`-хелперы для запуска из других задач.

- [ ] **Step 1: Проверить, что `@playwright/test` доступен**

Run: `node -v`
Expected: `v26.x` (>= 20). Если нет — `npx playwright --version` после установки.

- [ ] **Step 2: Добавить скрипт `start` в `server/package.json`**

В секцию `"scripts"` (вставить перед `"dev"`):

```json
"start": "tsx src/index.ts",
```

Это запуск без `tsx watch` — стабильный для CI/e2e/webServer.

- [ ] **Step 3: Создать `e2e/package.json`**

```json
{
  "name": "e2e",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "playwright test",
    "test:reporter": "playwright test --reporter=list",
    "install:browsers": "playwright install chromium",
    "lint": "oxlint"
  },
  "devDependencies": {
    "@playwright/test": "^1.62.1",
    "oxlint": "^1.75.0"
  }
}
```

- [ ] **Step 4: Установить зависимости**

Run: `cd e2e && npm install`
Expected: появился `e2e/package-lock.json`, `e2e/node_modules/@playwright/test`.

- [ ] **Step 5: `e2e/playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

const PORT_BACKEND = 4011;
const PORT_FRONT = 5173;

const CI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: CI ? 2 : 0,
  reporter: CI ? [["html", { open: "never" }], ["list"]] : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT_FRONT}`,
    timezoneId: "UTC",
    locale: "ru-RU",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm --prefix ../server start",
      url: `http://localhost:${PORT_BACKEND}/api/v1/event-types`,
      reuseExistingServer: !CI,
      env: { ...process.env, TZ: "UTC", PORT: String(PORT_BACKEND) },
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: "npm --prefix ../web run dev",
      url: `http://localhost:${PORT_FRONT}`,
      reuseExistingServer: !CI,
      env: { ...process.env, TZ: "UTC", VITE_PROXY_TARGET: `http://localhost:${PORT_BACKEND}` },
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

> Примечание: `reuseExistingServer: !CI` — локально можно использовать уже поднятые через `npm run dev`; в CI всегда свежие.

- [ ] **Step 6: `e2e/helpers.ts`**

Слот считаем как фиксированный час `08:00 UTC` текущего дня плюс `gap * 30` минут. В сетке UI всегда видны все 48 слотов текущего дня (бэкенд режет только по `from/to` запроса фронта, а не по `now`), поэтому любой полуночный-выровненный слот дня действителен и кликабелен, а уникальный `gap` гарантирует непересечение броней между тестами:

```ts
import type { APIRequestContext } from "@playwright/test";

export const BACKEND_URL = "http://localhost:4011";
export const STEP_MS = 30 * 60_000;

export interface SlotPlan {
  iso: string;
  label: string;
}

function utcLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export function slotTime(gap = 1): SlotPlan {
  const now = new Date();
  const dayStartUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const iso = new Date(dayStartUtc + 8 * 3600_000 + gap * STEP_MS).toISOString();
  return { iso, label: utcLabel(iso) };
}

export function dayButtonLabel(dayOffset = 1): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export async function seedEventType(
  request: APIRequestContext,
  name: string,
  description = "Описание",
  durationMinutes = 30,
): Promise<{ id: string; name: string }> {
  const res = await request.post(`${BACKEND_URL}/api/v1/admin/event-types`, {
    data: { name, description, durationMinutes },
  });
  if (!res.ok()) throw new Error(`seedEventType failed: ${res.status()} ${await res.text()}`);
  return (await res.json()) as { id: string; name: string };
}

export async function bookSlot(
  request: APIRequestContext,
  eventTypeId: string,
  guestName: string,
  startAt: string,
): Promise<{ id: string }> {
  const res = await request.post(`${BACKEND_URL}/api/v1/bookings`, {
    data: { eventTypeId, guestName, startAt },
  });
  if (!res.ok()) throw new Error(`bookSlot failed: ${res.status()} ${await res.text()}`);
  return (await res.json()) as { id: string };
}

export async function listBookings(request: APIRequestContext): Promise<unknown[]> {
  const res = await request.get(
    `${BACKEND_URL}/api/v1/admin/bookings?from=2000-01-01T00:00:00.000Z`,
  );
  if (!res.ok()) throw new Error(`listBookings failed: ${res.status()}`);
  return (await res.json()) as unknown[];
}
```

> Примечание: `GET /api/v1/admin/bookings` без `from` фильтрует по `Date.now()` (`server/src/routes/admin.ts:40`), поэтому проверки «POST не ушёл»/количества броней обязаны передавать `from` в прошлом — иначе слоты, забронированные в первой половине дня, выпадут из выборки.

> Примечание: единый `slotTime(gap)` — каждый тест использует свой уникальный `gap`, чтобы брони разных тестов не пересекались (слоты свободны только при отсутствии пересечения броней **любого** типа).

- [ ] **Step 7: `e2e/tsconfig.json` (для IDE/линта, не для билда)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"],
    "noEmit": true
  },
  "include": ["tests", "helpers.ts", "playwright.config.ts"]
}
```

- [ ] **Step 8: `.gitignore` — добавить e2e-артефакты**

В `/workspace/.gitignore` добавить:

```
e2e/test-results/
e2e/playwright-report/
e2e/blob-report/
e2e/playwright/.cache/
```

- [ ] **Step 9: Проверка конфига (без тестов)**

Run: `cd e2e && npx playwright test --list`
Expected: сообщение о том, что тестов не найдено (нет `errors` в конфиге); если будет ошибка синтаксиса — исправить.

> Примечание: реальные тесты появятся в Task 2; здесь проверяем, что конфиг парсится. При необходимости создать фиктивный `tests/smoke.spec.ts` и удалить.

- [ ] **Step 10: Commit**

```bash
git add e2e server/package.json .gitignore
git commit -m "chore(e2e): scaffold playwright package and backend start script"
```

---

### Task 2: Главный сценарий бронирования (`booking-flow.spec.ts`)

**Files:**
- Create: `e2e/tests/booking-flow.spec.ts`

**Interfaces:**
- Consumes: `seedEventType`, `bookSlot`, `slotTime`, `dayButtonLabel` из `e2e/helpers.ts`; UI текст из приложения.
- Produces: покрытие сценариев 1–3 (спека).

Примечания по UI-селекторам (без testid — только роли/тексты):
- админ-диалог: кнопка «Создать», поля по label «Название», «Описание», «Длительность, минут», кнопка «Сохранить»; после закрытия виден новый тип в таблице.
- гость: карточка типа с кнопкой «Выбрать время»; в `SlotPicker` кнопки-слоты подписаны `HH:mm`; форма — поле «Ваше имя» (placeholder «Иван»), кнопка «Записаться»; success — заголовок «Вы записаны!».
- админка броней: строка с именем гостя.

- [ ] **Step 1: Написать `e2e/tests/booking-flow.spec.ts`**

```ts
import { expect, test } from "@playwright/test";
import { seedEventType, slotTime } from "../helpers";

test.describe("Полный путь бронирования", () => {
  test("админ создаёт тип через UI → гость бронирует → бронь видна в админке", async ({
    page,
    request,
  }) => {
    await page.goto("/admin/event-types");
    await page.getByRole("button", { name: "Создать" }).click();

    await page.getByLabel("Название").fill("Консультация");
    await page.getByLabel("Описание").fill("Разбор вопросов");
    await page.getByLabel("Длительность, минут").fill("30");
    await page.getByRole("button", { name: "Сохранить" }).click();

    await expect(page.getByRole("table")).toContainText("Консультация");

    await page.goto("/");
    await page.getByRole("link", { name: /Консультация/ }).click();

    const plan = slotTime(1);
    await page.getByRole("button", { name: plan.label }).first().click();
    await page.getByLabel(/имя/).fill("Иван");
    await page.getByRole("button", { name: "Записаться" }).click();

    await expect(page.getByRole("heading", { name: "Вы записаны!" })).toBeVisible();

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
      await expect(page.getByRole("heading", { name: "Вы записаны!" })).toBeVisible();
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
    await expect(page.getByRole("button", { name: slotTime(10).label })).toBeVisible();
  });
});
```

> Примечание: кнопка занятого слота в приложении вообще не рендерится (`openSlots` фильтрует по `available`), поэтому проверяем `.toHaveCount(0)`.

- [ ] **Step 2: Установить браузер Chromium (первый раз)**

Run: `cd e2e && npm run install:browsers`
Expected: Chromium загружен в кэш Playwright (может потребоваться сеть; в CI — шаг `playwright install --with-deps chromium`).

- [ ] **Step 3: Прогнать тест**

Run: `cd e2e && npx playwright test tests/booking-flow.spec.ts`
Expected: 3 теста PASS. (webServer поднимет бэкенд+Vite автоматически.)

- [ ] **Step 4: Commit**

```bash
git add e2e/tests/booking-flow.spec.ts
git commit -m "test(e2e): full booking flow (admin create → guest book → admin list)"
```

---

### Task 3: Конфликт слота и валидация гостя

**Files:**
- Create: `e2e/tests/slot-conflict.spec.ts`, `e2e/tests/guest-validation.spec.ts`

**Interfaces:**
- Consumes: `seedEventType`, `bookSlot`, `slotTime`, `listBookings` из `helpers.ts`.

- [ ] **Step 1: `e2e/tests/slot-conflict.spec.ts` (сценарий 4)**

Сценарий «409»: страница загружена (слот виден), другой гость бронирует через API, кликаем тот же слот → тост «Слот уже занят», слот исчезает после invalidate.

```ts
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

    const bookings = await listBookings(request);
    expect(bookings).toHaveLength(1);
    expect(bookings[0]).toMatchObject({ guestName: "Соперник" });
  });
});
```

- [ ] **Step 2: Прогнать конфликт**

Run: `cd e2e && npx playwright test tests/slot-conflict.spec.ts`
Expected: 1 тест PASS.

- [ ] **Step 3: `e2e/tests/guest-validation.spec.ts` (сценарии 5–7)**

```ts
import { expect, test } from "@playwright/test";
import { seedEventType, listBookings, slotTime } from "../helpers";

test.describe("Валидация брони", () => {
  test("без выбранного слота — тост и POST не уходит", async ({ page, request }) => {
    const type = await seedEventType(request, "Созвон V");
    await page.goto(`/book/${type.id}`);
    await page.getByRole("button", { name: "Записаться" }).click();

    await expect(page.getByText("Сначала выберите слот")).toBeVisible();
    expect(await listBookings(request)).toHaveLength(0);
  });

  test("пустое имя — текст ошибки и POST не уходит", async ({ page, request }) => {
    const type = await seedEventType(request, "Созвон V2");
    const plan = slotTime(7);
    await page.goto(`/book/${type.id}`);
    await page.getByRole("button", { name: plan.label }).first().click();
    await page.getByRole("button", { name: "Записаться" }).click();

    await expect(page.getByText("Укажите имя")).toBeVisible();
    expect(await listBookings(request)).toHaveLength(0);
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
    expect(await listBookings(request)).toHaveLength(0);
  });
});
```

> Примечание: проверка «POST не уходит» — через `listBookings(request)` (реальный бэкенд), т.к. UI-тост появляется раньше сетевой ошибки.

- [ ] **Step 4: Прогнать валидацию**

Run: `cd e2e && npx playwright test tests/guest-validation.spec.ts`
Expected: 3 теста PASS.

- [ ] **Step 5: Commit**

```bash
git add e2e/tests/slot-conflict.spec.ts e2e/tests/guest-validation.spec.ts
git commit -m "test(e2e): slot conflict (409) and guest validation cases"
```

---

### Task 4: Навигация и краевые (`app-navigation.spec.ts`)

**Files:**
- Create: `e2e/tests/app-navigation.spec.ts`

**Interfaces:**
- Consumes: `seedEventType`, `slotTime`, `dayButtonLabel` из `helpers.ts`.

- [ ] **Step 1: Написать тесты**

```ts
import { expect, test } from "@playwright/test";
import { seedEventType, slotTime, dayButtonLabel } from "../helpers";

test.describe("Навигация и краевые случаи", () => {
  test("несуществующий тип события — слотов нет (404 бэкенда)", async ({ page }) => {
    await page.goto("/book/00000000-0000-0000-0000-000000000000");
    await expect(page.getByText("На этот день свободных слотов нет")).toBeVisible();
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

    const plan = slotTime(2);
    await expect(page.getByRole("button", { name: plan.label })).toBeVisible();
  });
});
```

> Примечание: день 2 всегда полностью свободен (нет броней → все слоты дня 2 доступны), поэтому выбор времени на день 2 стабилен в любой момент суток.
>
> Примечание (адаптация сценария 9 спеки): общий in-memory store заполняется
> ранними spec-файлами, поэтому e2e не проверяет точные empty-state тексты («Типов
> событий пока нет» / «Типов событий пока нет. Создайте первый.») — вместо этого
> тест проверяет, что страницы рендерятся (guest-заголовок, админ-заголовок).
> Точные тексты покрыты unit-тестами (`web/src/pages/guest/HomePage.test.tsx`,
> `web/src/pages/admin/AdminEventTypesPage.test.tsx`).

- [ ] **Step 2: Прогнать навигацию**

Run: `cd e2e && npx playwright test tests/app-navigation.spec.ts`
Expected: 5 тестов PASS.

- [ ] **Step 3: Полный прогон e2e**

Run: `cd e2e && npx playwright test`
Expected: 12 тестов PASS (3+1+3+5).

- [ ] **Step 4: Lint e2e**

Run: `cd e2e && npm run lint`
Expected: без ошибок (предупреждения допустимы).

- [ ] **Step 5: Commit**

```bash
git add e2e/tests/app-navigation.spec.ts
git commit -m "test(e2e): navigation edge cases (404, empty store, unknown route, day switch)"
```

---

### Task 5: CI-воркфлоу

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Написать `.github/workflows/ci.yml`**

```yaml
name: ci

on:
  push:
    branches: [main]
  pull_request:

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: server/package-lock.json
      - run: npm --prefix server ci
      - run: npm --prefix server run test
      - run: npm --prefix server run build
      - run: npm --prefix server run lint

  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: web/package-lock.json
      - run: npm --prefix web ci
      - run: npm --prefix web run build
      - run: npm --prefix web run lint
      - run: npm --prefix web run test

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: e2e/package-lock.json
      - run: npm --prefix e2e ci
      - run: npx playwright install --with-deps chromium
        working-directory: e2e
      - run: npm --prefix e2e run test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: e2e/playwright-report/
          retention-days: 7
```

> Примечание: `node-version: 22` — LTS (движок @playwright/test: >=20). Если в CI-раннере нужно больше, можно 24; версии server/web уже на `typescript ~6`/`vite 8` без требований выше 22.

- [ ] **Step 2: Проверить YAML-синтаксис**

Run: `node -e "const y=require('js-yaml'); console.log('ok')"` (если пакета нет — пропустить, проверка глазомерно/редактором).
Expected: файл валиден.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: run unit tests, builds, lint, and e2e on push and PR"
```

---

### Task 6: release-please

**Files:**
- Create: `.github/workflows/release-please.yml`

- [ ] **Step 1: Написать `.github/workflows/release-please.yml`**

```yaml
name: release-please

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          release-type: simple
```

> Примечание: `release-type: simple` — версия растёт в тегах (`v1.2.3`) и changelog, `package.json` не правится. Мердж release-PR в `main` создаст тег и GitHub Release.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/release-please.yml
git commit -m "ci: add release-please release workflow"
```

---

### Task 7: Документация, корневые скрипты, финальная проверка

**Files:**
- Modify: `AGENTS.md`, `package.json` (root), `.gitignore`
- Test: локальные прогоны unit + e2e

- [ ] **Step 1: Добавить требование «Отвечай на русском» в `AGENTS.md`**

В самое начало (после вводной фразы о сервисе) добавить строку-абзац:

```markdown
## Язык общения

- Агент отвечает пользователю **на русском языке** (комментарии в коде — по конвенции репозитория, без жёстких требований).
```

- [ ] **Step 2: Добавить секцию «Коммиты и релизы» в `AGENTS.md`**

В конец файла добавить:

```markdown
## Коммиты и релизы

- Каждый коммит — **Conventional Commits**: `<type>(<scope>): <описание>`.
  Допустимые типы: `feat`, `fix`, `chore`, `docs`, `test`, `ci`, `refactor`,
  `perf`, `build`, `revert`. Scope необязателен (`feat(e2e):`, `ci:`, `docs:`).
- Ломающие изменения: `!` после типа или строка `BREAKING CHANGE:` в теле.
- **Агент обязан** соблюдать формат в каждом коммите — release-please
  (`release-please-action`, `.github/workflows/release-please.yml`) формирует
  changelog и версию по этим сообщениям.
- Показывать коммиты агента в том же стиле, что и историю репозитория.
```

- [ ] **Step 3: Добавить e2e-команды и CI-инфо в `AGENTS.md`**

Расширить блок «Команды» (в `## Commands` корня и/или в раздел про `web/`) строками:

```markdown
- `npm --prefix e2e run test` — Playwright e2e (поднимает бэкенд+Vite сам, детерминированно в UTC)
- `npx playwright install chromium` — установка браузера для e2e (первый раз)
- CI: `.github/workflows/ci.yml` (backend, web, e2e); release: `.github/workflows/release-please.yml`
```

- [ ] **Step 4: Корневой скрипт `test:e2e` в `package.json`**

В `"scripts"` добавить:

```json
"test:e2e": "npm --prefix e2e run test",
```

- [ ] **Step 5: Проверить root `.gitignore`**

Run: `cat /workspace/.gitignore`
Expected: есть `e2e/test-results/`, `e2e/playwright-report/`, `e2e/blob-report/`, `e2e/playwright/.cache/` (из Task 1).

- [ ] **Step 6: Финальная проверка unit-тестов и сборок**

Run:
```bash
npm --prefix server run test && npm --prefix server run build && npm --prefix server run lint
npm --prefix web run build && npm --prefix web run lint && npm --prefix web run test
npm --prefix e2e run test
```
Expected: всё зелёное.

- [ ] **Step 7: Проверить, что `hexlet-check.yml` не тронут**

Run: `git status --short`
Expected: `.github/workflows/hexlet-check.yml` отсутствует в списке изменённых.

- [ ] **Step 8: Commit**

```bash
git add AGENTS.md package.json
git commit -m "docs: conventional commits, russian replies, e2e commands; add root e2e script"
```

---

### Task 8: Локальные MCP-инструменты агента (Playwright MCP, Chrome Devtools MCP)

**Files:**
- Modify: `opencode.json` (**gitignored** — локальная конфигурация, в коммиты не попадает), `AGENTS.md` (справка об использовании)

**Interfaces:**
- Produces: MCP-серверы `playwright` и `chrome-devtools` в конфиге opencode; правило в `AGENTS.md` о диагностике e2e через них. Работа MCP не требуется ни для CI, ни для e2e-прогона — это инструменты агента для интерактивной отладки.

Примечание: `opencode.json` в `.gitignore` — изменения в нём не коммитятся, поэтому задача разделена на локальную часть (конфиг) и документируемую в репозитории (AGENTS.md).

- [ ] **Step 1: Добавить MCP-секцию в `opencode.json`**

В `"provider"` (после `models`) добавить блок `"mcp"`:

```json
"mcp": {
  "playwright": {
    "type": "local",
    "command": ["npx", "-y", "@playwright/mcp@latest"],
    "enabled": true
  },
  "chrome-devtools": {
    "type": "local",
    "command": ["npx", "-y", "chrome-devtools-mcp@latest"],
    "enabled": true
  }
}
```

> Если в данной версии opencode тип `"local"` не поддерживается — использовать синтаксис, принятый в вашей сборке (`"command"` + `"args"`), сохранив имена `playwright` и `chrome-devtools`. Файл локальный (gitignored), коммит для конфига не требуется.

- [ ] **Step 2: Проверить, что MCP-серверы доступны**

Run: `.gitignore` уже содержит `opencode.json`; перезапустить opencode, чтобы подхватить MCP.
Expected: в списке инструментов/`/mcp` появились `playwright` и `chrome-devtools`; ошибок запуска нет. Если `npx` кэшируется — первый запуск может скачивать пакеты (нужна сеть).

- [ ] **Step 3: Smoke-проверка Playwright MCP (опционально)**

Для ручной проверки поднять окружение:
```bash
npm --prefix server run start &
npm --prefix web run dev
```
Затем инструментом `playwright` открыть `http://localhost:5173` и убедиться, что главная страница рендерится (текст «Сервис бронирования»). Убрать фоновые процессы после проверки (`kill %1` и Ctrl-C).

- [ ] **Step 4: Добавить правило про диагностику e2e в `AGENTS.md`**

В секцию «Dev workflow quirks» (или рядом с e2e-командами из Task 7) добавить:

```markdown
- Для интерактивной отладки e2e у агента есть локальные MCP-инструменты (конфиг в `opencode.json`, gitignored): **Playwright MCP** (`playwright`) — запуск браузерных сценариев, **Chrome Devtools MCP** (`chrome-devtools`) — сеть/консоль/состояние страницы. Автотесты (`npm --prefix e2e run test`) MCP не требуют — это CI/стабильные e2e; MCP — для живой диагностики при разработке.
```

- [ ] **Step 5: Commit (только AGENTS.md; opencode.json не коммитится)**

```bash
git add AGENTS.md
git commit -m "docs: agent diagnostics via playwright and chrome-devtools MCP"
```

---

### Task 9: Верификация релизного пути (требует GitHub, локально недоступно)

- [ ] **Step 1: После пуша в `main`**

Expected: появится/обновится release-PR из `release-please-action` (changelog собран из Conventional Commits).

- [ ] **Step 2: Мердж release-PR**

Expected: создаётся тег `vX.Y.Z` и GitHub Release.

- [ ] **Step 3: Пометка**

Это шаг недоступен локально (нужен GitHub) — выполняется после CI-проверки workflow. Проверка: `gh pr list --state open` и `gh release list` (при наличии `gh` и прав).

---

## Замечания для исполнителя

- Порт/таймзона: все процессы и браузер — UTC; в настройках CI `TZ` не задаём явно, т.к. `webServer.env` уже содержит `TZ: UTC`, а `timezoneId` — в конфиге.
- Не добавлять testid в приложение: тесты используют роли и видимые тексты (конвенция проекта — без testid).
- Первый локальный запуск e2e требует `npm --prefix e2e run install:browsers` (сеть).
- `listBookings` проверяет «POST не ушёл», а не только тост/текст — это честная проверка отсутствия записи в реальном бэкенде.
- Если в CI Vite нужен `strictPort` — порт 5173 свободен (В CI всегда свежие контейнеры), дополнительная настройка не требуется.
- documented единственный `hexlet-check.yml` — не редактировать.
