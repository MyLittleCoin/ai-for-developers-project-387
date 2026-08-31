import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

const INDEX_HTML = "<!doctype html><html><body>Calendar App</body></html>";
const ASSET_JS = "console.log('asset');";

describe("раздача собранного фронтенда", () => {
  let app: FastifyInstance;
  let dir: string;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "static-"));
    mkdirSync(join(dir, "assets"), { recursive: true });
    writeFileSync(join(dir, "index.html"), INDEX_HTML);
    writeFileSync(join(dir, "assets", "app.js"), ASSET_JS);
    app = buildApp({ staticDir: dir });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  });

  test("GET / отдаёт index.html", async () => {
    const res = await request(app.server).get("/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("Calendar App");
  });

  test("SPA-роут без файла отдаёт index.html", async () => {
    const res = await request(app.server).get("/book/et-1/success");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("Calendar App");
  });

  test("GET по существующему asset отдаёт файл", async () => {
    const res = await request(app.server).get("/assets/app.js");
    expect(res.status).toBe(200);
    expect(res.text).toBe(ASSET_JS);
  });

  test("API остаётся рабочим при включённой статике", async () => {
    const res = await request(app.server).get("/api/v1/event-types");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("неизвестный API-путь отдаёт JSON 404", async () => {
    const res = await request(app.server).get("/api/v1/unknown");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.body.code).toBe("not_found");
  });

  test("POST на неизвестный путь отдаёт JSON 404, а не HTML", async () => {
    const res = await request(app.server).post("/some-route");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toContain("application/json");
  });
});
