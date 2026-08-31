# Дизайн фронтенда Calendar Booking Service

**Дата:** 2026-08-15
**Статус:** одобрено пользователем (в чате, сессии планирования)

## Цель

Создать фронтенд для сервиса бронирования календаря, контракт которого описан в
`main.tsp` (TypeSpec). Приложение покрывает два контура API:

- **Гость** (без авторизации): просмотр типов событий, выбор свободного слота,
  создание бронирования.
- **Админ** (владелец, предзаданный профиль, без авторизации): управление типами
  событий, просмотр предстоящих броней.

## Ограничения

- Контракт (`main.tsp`, `tspconfig.yaml`) не изменяется.
- В контракте **нет** DELETE/PUT для типов событий и **нет** отмены брони —
  эти функции не проектируются.
- Тексты интерфейса на русском языке (соответствует контракту).
- Все времена к API передаются в UTC (ISO 8601 с суффиксом `Z`); в интерфейсе —
  локальная таймзона браузера.
- Ошибки API переводятся в русские сообщения по коду из контракта:
  - 400 `bad_request` → «Неверные данные»
  - 404 `not_found` → «Не найдено»
  - 409 `slot_conflict` → «Слот уже занят»
  - прочее → «Ошибка сервера»

## Архитектура

Новое Vite-приложение в `/workspace/web` (React + TypeScript). Один SPA:

- Маршруты гостя: `/`, `/book/:eventTypeId`, `/book/:eventTypeId/success`.
- Маршруты админа: `/admin`, `/admin/event-types`, `/admin/event-types/:id`,
  `/admin/bookings`.
- Гость и админ — в одном приложении с разными лейаутами.

Типы API генерируются из `dist/openapi.yaml` (эмиттер `@typespec/openapi3`,
скрипт `npm run gen` в корне) через `openapi-typescript`. Запросы выполняются
типобезопасным `openapi-fetch`, обёрнутым в функции, которые:

- прокидывают нужные пути/заголовки/тело;
- нормализуют ошибки в класс `ApiError` со статусом и кодом из тела ошибки.

Управление данными — TanStack Query:

- слоты кэшируются и инвалидируются после брони;
- списки типов событий инвалидируются после создания в админке;
- список предстоящих встреч обновляется по таймеру.

UI — shadcn/ui (Tailwind v4): таблицы, диалоги, формы, скелетоны, тосты (sonner).

CORS во время разработки обходится Vite dev-proxy: `/api → http://localhost:4010`,
где Prism мокает контракт.

## Компоненты

### Гость

- **HomePage** (`/`): список типов событий из GET `/event-types`; карточки —
  название, описание, длительность; кнопка «Выбрать время» ведёт на страницу брони.
- **BookPage** (`/book/:eventTypeId`): `SlotPicker` + `BookingForm`.
  - **SlotPicker**: выбор дня из 14-дневного окна (сетка локальных дней, начинается
    с сегодняшнего); на день GET `/event-types/{id}/slots?from&to`; показываются
    только `available: true`; шаг слотов 30 минут (часы 00/30).
  - **BookingForm**: имя гостя (`guestName`, непустая строка, до 200 символов),
    react-hook-form + zod.
  - Создание брони POST `/bookings`; при 201 — переход на страницу успеха;
    при 409 — тост «Слот уже занят» и инвалидация слотов.
- **SuccessPage** (`/book/:eventTypeId/success`): подтверждение — тип события,
    имя гостя, время встречи в локальном поясе. Данные из `location.state`;
    при их отсутствии — редирект на `/`.

### Админ (лейаут `/admin` с навигацией: «Типы событий», «Встречи»)

- **AdminEventTypesPage** (`/admin/event-types`): таблица (shadcn Table) —
  название, описание, длительность; кнопка «Подробнее»; диалог создания
  POST `/admin/event-types` (форма: `name` непустая, `description` опционально
  непустая, `durationMinutes` целое ≥ 1).
- **AdminEventTypeDetailPage** (`/admin/event-types/:id`): карточка по
  GET `/admin/event-types/{id}`; состояние NotFound.
- **AdminBookingsPage** (`/admin/bookings`): таблица предстоящих встреч —
  имя гостя, тип события, начало/конец в локальном поясе с указанием пояса;
  GET `/admin/bookings?from=<now UTC>`; рефреш каждые 60 секунд; пустое состояние
  «Ближайших встреч нет».
- **NotFoundPage**: 404 для неизвестных путей.

## Поток данных

- `SlotPicker` формирует окно локальных дней → переводит в UTC в `from`/`to` →
  GET слотов → фильтр по `available` → выбор слота → `BookingForm` → POST.
- Мутация бронирования: 201 → redirect на success; 409 → тост + invalidate слотов;
  400 → сообщение валидации возле формы.
- Админ: после создания типа — invalidate списка; список броней — useQuery с
  `refetchInterval`.

## Обработка ошибок и состояний

- Загрузка: скелетоны (shadcn Skeleton).
- Пустые состояния: у списков («Встреч нет», «Типов событий пока нет»).
- Ошибки запросов: тост sonner с русским сообщением, страница ошибки не требуется.
- 404 на детальной странице админа: встроенное состояние в странице.

## Инфраструктура разработки

- Корневые скрипты:
  - `gen:types` — `npm run gen && openapi-typescript dist/openapi.yaml -o web/src/lib/schema.ts`
  - `dev:mock` — `prism mock dist/openapi.yaml -p 4010`
  - `dev:front` — `npm --prefix web run dev`
- dev-зависимость корня: `@stoplight/prism-cli`.
- OpenCode MCP: подключить shadcn MCP (https://ui.shadcn.com/docs/mcp) для
  добавления компонентов; Prism работает как локальный мок-процесс, не MCP.

## Тестирование

Vitest + React Testing Library + jest-dom. Моки на уровне модуля `@/lib/api`
(подмена функций-обёрток). Ключевые сценарии:

- флоу гостя: типы → выбор свободного слота → имя → POST с корректными данными;
- обработка 409: тост «Слот уже занят», слот исчезает из списка;
- админка: валидация формы создания типа, вызов POST, обновление списка;
- таблица броней админа.

## Файловая структура (на момент разработки)

```
web/
  package.json, vite.config.ts, tsconfig*.json, components.json, index.html
  src/
    main.tsx, App.tsx, index.css
    lib/       client.ts, api.ts, errors.ts, dates.ts, schema.ts, utils.ts
    components/ui/         shadcn-компоненты
    components/ PageHeader.tsx
    components/guest/      EventTypeCard, SlotPicker, BookingForm
    components/admin/      EventTypeTable, EventTypeFormDialog, BookingsTable
    features/guest/        useEventTypes, useSlots, useCreateBooking
    features/admin/        useAdminEventTypes, useCreateEventType, useAdminBookings
    pages/guest/           HomePage, BookPage, SuccessPage
    pages/admin/           AdminEventTypesPage, AdminEventTypeDetailPage, AdminBookingsPage
    pages/                 NotFoundPage
    test/ setup.ts
  test/ (корневые тесты приложения)
```
