# Calendar Booking Service
### Deploy link
https://web-production-e3ae22.up.railway.app/
### Hexlet tests and linter status:
[![Actions Status](https://github.com/MyLittleCoin/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/MyLittleCoin/ai-for-developers-project-386/actions)

Сервис бронирования календаря. В репозитории есть TypeSpec-контракт API
(`main.tsp`), бэкенд (`server/`) на Fastify + TypeScript с in-memory
хранилищем и фронтенд (`web/`) на Vite + React + TypeScript + shadcn/ui.

## Разработка

Подготовка типов из контракта:

```bash
npm run gen:types       # сгенерировать dist/openapi.yaml и web/src/lib/schema.ts
```

Бэкенд и фронтенд — два процесса (удобно запускать одной командой):

```bash
npm run dev             # бэкенд :4011 + Vite :5173 параллельно
```

По отдельности:

```bash
npm run dev:backend     # Fastify-бэкенд на http://localhost:4011 (PORT для смены порта)
npm run dev:front       # Vite dev-сервер на http://localhost:5173
```

Хранилище in-memory: после перезапуска сервиса данные сбрасываются.

Мок-сервер по контракту для сверки спецификации:

```bash
npm run gen
npm run dev:mock        # Prism-мок на http://localhost:4010
```

Vite dev-сервер проксирует `/api` на бэкенд (`VITE_PROXY_TARGET` для смены
цели), поэтому API в браузере отвечает по реальным данным.

Тесты и сборка:

```bash
npm --prefix web run test      # Vitest (фронтенд)
npm --prefix server run test   # Vitest (бэкенд)
npm --prefix server run build  # typecheck (tsc)
```

## API

Контракт описан в `main.tsp` (TypeSpec). Открытая спецификация генерируется
в `dist/openapi.yaml`:

```bash
npm run gen
```

- **Гость**: `GET /event-types`, `GET /event-types/{id}/slots`, `POST /bookings`
- **Админ** (без авторизации): `GET /admin/event-types`, `POST /admin/event-types`,
  `GET /admin/event-types/{id}`, `GET /admin/bookings`
