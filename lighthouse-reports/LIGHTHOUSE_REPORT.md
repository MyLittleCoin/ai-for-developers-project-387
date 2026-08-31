# Отчёт Lighthouse — ночная проверка производительности

- **Целевой URL:** https://web-production-e3ae22.up.railway.app/
- **Дата проверки:** 2026-08-31
- **Инструмент:** Lighthouse CLI 13.4.1 (Chrome headless, `--no-sandbox`)
- **Отчёты:** `lighthouse-reports/report.report.html`, `lighthouse-reports/report.report.json`

## Сводка по категориям

| Категория | Оценка |
|---|---|
| Performance | **98** |
| Accessibility | **97** |
| Best Practices | **100** |
| SEO | **82** |
| Agentic browsing (доп.) | 67 |

Сайт показывает выдающиеся результаты по производительности, доступности и практикам. Основные проблемы сосредоточены в SEO.

## Ключевые метрики производительности

| Метрика | Значение | Норма |
|---|---|---|
| First Contentful Paint (FCP) | 1.7 с | ≤ 1.8 с |
| Largest Contentful Paint (LCP) | 1.7 с | ≤ 2.5 с |
| Speed Index (SI) | 3.0 с | ≤ 3.4 с |
| Total Blocking Time (TBT) | 0 мс | ≤ 200 мс |
| Cumulative Layout Shift (CLS) | 0 | ≤ 0.1 |
| Time to Interactive (TTI) | 1.7 с | ≤ 3.8 с |
| Server Response (TTFB) | 70 мс | ≤ 0.6 с |

Производительность практически идеальная: быстрый ответ сервера (70 мс), минимальный JS-блокирующий трафик, нулевые сдвиги раскладки. Оппортунити-аудиты Lighthouse не обнаружили — дополнительных правок для повышения Performance не требуется.

## Ключевые проблемы

### SEO (82/100) — 3 провала
1. **Невалидный `robots.txt` (score 0)** — на запрос `/robots.txt` сервер отдаёт SPA-страницу (`index.html`, `<!doctype html>`). Файл `robots.txt` на деплое отсутствует, и его отсутствие маскируется fallback'ом на index.html. Из-за этого краулеры не могут прочитать директивы индексации.
2. **Отсутствует `llms.txt` (score 0)** — файла `/llms.txt` нет; также нет H1-заголовка и ссылок, из-за чего LLM-краулеры хуже понимают структуру сайта.
3. **Нет `meta description` (score 0)** — страница не содержит `<meta name="description">`, поэтому в выдаче поисковики формируют сниппет «из воздуха».

### Accessibility (97/100) — 1 провал
4. **Нет landmark `main` (score 0)** — у документа отсутствует единственный `<main>`, что мешает навигации скринридерам.

### Best Practices (100/100)
5. **Source maps для крупного JS-бандла (score 0 по `valid-source-maps`)** — `index-CK0d_-xr.js` собран без source map (не влияет на общий балл 100, но усложняет отладку в проде).

## Список правок в проекте

**Внешнее расположение (фронтенд Vite `web/`) — правочки №1–3:**
1. **Добавить `web/public/robots.txt`** — Vite копирует `public/` в корень `dist/`, и на деплое (Railway + статический хостинг) файл начнёт отдаваться по `/robots.txt` вместо fallback'а на index.html. Содержимое, минимум:
   ```
   User-agent: *
   Allow: /
   ```
   При желании добавить `Disallow: /admin` и строку `Sitemap:`.
2. **Добавить `web/public/llms.txt`** — Markdown-файл с H1-заголовком (`# ...`) и ссылками на ключевые страницы (главная `/`, `/schedule`, пример бронирования `/book/...`).
3. **В `web/index.html` добавить `<meta name="description">`** (например, краткое описание сервиса бронирования на русском, ~130–160 символов).

**Зависит от правки №4 (только для частей, где нужно):**
4. **Добавить landmark `<main>`** — обернуть разметку приложения в единый `<main>`. Самое надёжное — в `web/index.html` вокруг `<div id="root">`, тогда landmark будет на всех маршрутах (включая 404). Перед этим проверить, что ни один layout (`web/src/pages/guest/GuestLayout.tsx`, `web/src/pages/admin/AdminLayout.tsx`) не рендерит собственный `<main>` — иначе будет вложенность.

**По желанию (не влияет на баллы):**
5. **Source maps для прод-сборки** — включить `sourcemap` в `build` Vite либо деплоить source maps только для отладки (правка в `web/vite.config.ts`), чтобы упростить чтение стектрейсов в проде.
6. **`agentic-browsing` 67/100** — новая категория Lighthouse (навигация LLM-агентов): после правок `llms.txt` и `meta description` часть проблем закроется автоматически.

## Как воспроизвести

```bash
lighthouse "https://web-production-e3ae22.up.railway.app/" \
  --chrome-flags="--headless --no-sandbox" \
  --output=html --output=json --output-path=lighthouse-reports/report --quiet
```
