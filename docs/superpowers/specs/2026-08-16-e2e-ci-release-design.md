# Дизайн: e2e-тесты (Playwright), CI, Conventional Commits и release-please

**Дата:** 2026-08-16
**Статус:** одобрено пользователем (в чате, сессии брейнсторминга)

## Цель

Закрыть «пользовательский сценарий» сверху вниз:

1. **Интеграционные (e2e) тесты** — Playwright, реальный браузер, связка реального
   бэкенда (`server/`, Fastify, :4011) и фронтенда (`web/`, Vite, :5173).
   Покрыть основной сценарий бронирования и набор популярных/краевых случаев.
2. **CI** — GitHub Actions: прогон unit-тестов, сборки, линтера и e2e.
3. **Conventional Commits** — зафиксировать формат сообщений коммитов в
   `AGENTS.md` (в т.ч. для коммитов агента).
4. **release-please** — автоформирование release-PR, changelog и версии в `main`.

## Ограничения

- `hexlet-check.yml` **не трогать** (README: не удалять/не редактировать).
- Контракт (`main.tsp`) не меняется; backend-логика не меняется.
- Прошитые в репозитории скрипты `dev:*` сохраняются.
- Коммиты — только Conventional Commits.
- Ответы / комментарии агента — на русском языке.
- Playwright-пакет отдельный (`e2e/`), не внутри `web/` (решение пользователя).

## Решения (одобрены пользователем)

- Расположение: отдельный пакет `e2e/` в корне.
- Главный сценарий — полный путь через админ-UI → гость → админка.
- Conventional Commits — только документирование в `AGENTS.md` (без commitlint в CI).
- release-please: `release-type: simple` (теги + changelog + Release, без правки
  `package.json`).
- CI: полный прогон (unit + build + lint + e2e).

## Архитектура e2e

### Пакет `e2e/`

- `e2e/package.json` — `@playwright/test`, `oxlint`, `typescript`; скрипты:
  - `test` — `playwright test`
  - `install:browsers` — `playwright install chromium`
- `e2e/playwright.config.ts`:
  - `testDir: "./tests"`, `fullyParallel`, `retries: 2` в CI;
  - `use.baseURL: "http://localhost:5173"`, `timezoneId: "UTC"`,
    `locale: "ru-RU"`, `trace: "on-first-retry"`;
  - `webServer` (массив): бэкенд `npm --prefix ../server start` на :4011 и Vite
    `npm --prefix ../web run dev` на :5173 (каждый с `env: { TZ: "UTC" }`);
    `reuseExistingServer: !process.env.CI`.
- Для стабильного запуска без `watch` добавляется скрипт `server/package.json`:
  `"start": "tsx src/index.ts"`.
- `.gitignore` (корень): `e2e/test-results/`, `e2e/playwright-report/`,
  `e2e/blob-report/`, `e2e/playwright/.cache/`.

### Детерминизм времени

Слоты считаются бэкендом в UTC (сетка 30 мин), фронт показывает в локальной
таймзоне. Чтобы тесты были детерминированными:

- все процессы (`server`, Vite) и браузер (`timezoneId`) живут в `UTC`;
- слот для брони вычисляется в тесте как следующий 30-минутный рубеж от `now`
  (UTC), с защитой на поздний час дня (если рубеж за пределами текущего дня —
  взять слот следующего дня);
- кнопка дня в `SlotPicker` подписывается `toLocaleDateString("ru-RU",
  { day: "numeric", month: "short" })`.

### Сидинг данных в e2e

- Основной happy-path идёт через UI полностью.
- Для краевых сценариев (409, валидация, навигация) данные создаются напрямую
  через Playwright `request`-фикстуру на реальный бэкенд:
  `→ POST http://localhost:4011/api/v1/admin/event-types`,
  `→ POST http://localhost:4011/api/v1/bookings`.
- Хранилище бэкенда — in-memory (сидов нет) ⇒ каждый прогон стартует с чистого
  состояния, локально и в CI.

## Сценарии e2e (файлы `e2e/tests/*.spec.ts`)

### 1. `booking-flow.spec.ts` — популярные
1. **Happy path (полный путь):** админ создаёт тип через UI → гость на `/` видит
   карточку → выбирает слот → имя → success → бронь видна в `/admin/bookings`.
2. **Два гостя, разные слоты одного типа:** обе брони создаются, обе видны в
   админке, отсортированы по времени.
3. **Повторный заход после своей брони:** занятый слот в `SlotPicker` не
   выбирается (элемент disabled/отсутствует).

### 2. `slot-conflict.spec.ts` — краевые
4. **409:** админ-API создаёт тип и бронирует слот → гость через UI выбирает тот
   же слот → тост «Слот уже занят», слот исчезает из доступных (invalidate).

### 3. `guest-validation.spec.ts` — краевые
5. **Нет выбранного слота + «Записаться»:** тост «Сначала выберите слот», POST
   не уходит.
6. **Пустое имя:** «Укажите имя», POST не уходит.
7. **Длинное имя (>200):** «Имя не длиннее 200 символов», POST не уходит.

### 4. `app-navigation.spec.ts` — краевые
8. **Несуществующий тип события:** `/book/<bad-id>` → состояние «не найдено»
   (404 от бэкенда).
9. **Пустое хранилище:** при пустом store страницы рендерятся корректно
   (guest-заголовок «Сервис бронирования», админ-заголовок «Типы событий») —
   точные empty-state тексты («Типов событий пока нет» /
   «Типов событий пока нет. Создайте первый.») не проверяются e2e, т.к.
   общий in-memory store заполняется ранними spec-файлами; эти тексты
   покрыты unit-тестами (`HomePage.test.tsx`,
   `AdminEventTypesPage.test.tsx`).
10. **Неизвестный маршрут:** NotFoundPage.
11. **Прямой переход на `/book/<id>/success` без state:** редирект на `/`.
12. **Навигация по дням в SlotPicker:** переключение дня → слоты другого дня.

## CI — `.github/workflows/ci.yml`

Три параллельных джоба на `ubuntu-latest` (после checkout + setup-node + cache):

- **backend:** `npm --prefix server ci && npm --prefix server run test && npm --prefix server run build && npm --prefix server run lint`
- **web:** `npm --prefix web ci && npm --prefix web run build && npm --prefix web run lint && npm --prefix web run test`
- **e2e:** `npm --prefix e2e ci && npx playwright install --with-deps chromium` →
  `npm --prefix e2e run test` (webServer поднимает бэкенд+Vite сам, `TZ=UTC`).

Triggers: `push` (main) и `pull_request`. upload artifact `playwright-report`
при failure для диагностики.

## Conventional Commits + release-please

В `AGENTS.md` добавляется секция «Коммиты и релизы»:
- префиксы: `feat`, `fix`, `chore`, `docs`, `test`, `ci`, `refactor`, `perf`,
  `build`, `revert`; необязательный scope (`feat(e2e):`, `ci:`);
- тип «ломающих» изменений — `!` или `BREAKING CHANGE`;
- правило для агента: каждый коммит соответствует формату;
- `release-please` сам формирует changelog по этим сообщениям.

Workflow `.github/workflows/release-please.yml`:
- trigger: `push` на `main`;
- `permissions: { contents: write, pull-requests: write }`;
- `googleapis/release-please-action@v4`, `with: { release-type: simple }`.
- Результат: release-PR (changelog + версия) → после мерджа тег `vX.Y.Z` и GitHub
  Release.

`AGENTS.md` также получает требование «Отвечай на русском языке» и команды e2e.

## Корневые скрипты

`package.json` (root): добавить `"test:e2e": "npm --prefix e2e run test"`.

## Тестирование

- Локально: `npx playwright install chromium` (первый раз) + `npm --prefix e2e run test`;
  затем финальная проверка `npm --prefix server run all`-эквивалентов (test/build/lint)
  и `npm --prefix web run` (build/lint/test).
- CI-проверка e2e-воркфлоу — после пушей/PR.
- Проверка release-please: после мерджа в `main` появится/обновится release-PR;
  после его мерджа — тег и Release (локально невоспроизводимо без доступа к CI).

## MCP-инструменты агента (локальные, опциональные)

Ссылки из ТЗ (Playwright MCP — запуск браузерных сценариев, Chrome Devtools MCP —
диагностика сети/консоли/состояния) подключаются как локальные MCP-серверы в
`opencode.json` (файл gitignored, в репозиторий не попадает):

- `playwright` — `npx -y @playwright/mcp@latest`;
- `chrome-devtools` — `npx -y chrome-devtools-mcp@latest`.

Они нужны агенту для **интерактивной отладки** e2e-сценариев и не требуются ни
для CI-воркфлоу, ни для прогона `e2e/` (автотесты детерминированы и работают без
MCP). В `AGENTS.md` фиксируется соответствующая памятка.
