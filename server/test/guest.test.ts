import { afterEach, beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import type { FastifyInstance } from "fastify";
import { createTestServer, localDateWithOffset, seedEventType } from "./helpers.js";

describe("GET /api/v1/event-types", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestServer();
  });

  afterEach(async () => {
    await app.close();
  });

  test("возвращает пустой список без созданных типов", async () => {
    const res = await request(app.server).get("/api/v1/event-types");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("возвращает созданные типы событий", async () => {
    const et = await seedEventType(app, "Созвон", 30);
    const res = await request(app.server).get("/api/v1/event-types").expect(200);
    expect(res.body).toEqual([
      {
        id: et.id,
        name: "Созвон",
        description: "Обсуждение проекта",
        durationMinutes: 30,
      },
    ]);
  });
});

describe("GET /api/v1/event-types/:id/slots", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestServer();
  });

  afterEach(async () => {
    await app.close();
  });

  test("возвращает 404 для неизвестного типа события", async () => {
    const res = await request(app.server).get("/api/v1/event-types/nope/slots");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("not_found");
  });

  test("возвращает слоты в заданном интервале по умолчанию свободными", async () => {
    const et = await seedEventType(app, "Созвон", 60);
    const from = new Date("2026-08-10T00:00:00.000Z");
    const to = new Date("2026-08-10T01:30:00.000Z");

    const res = await request(app.server)
      .get(`/api/v1/event-types/${et.id}/slots?from=${from.toISOString()}&to=${to.toISOString()}`)
      .expect(200);

    expect(res.body).toHaveLength(3);
    expect(res.body[0]).toEqual({
      eventTypeId: et.id,
      startAt: "2026-08-10T00:00:00.000Z",
      endAt: "2026-08-10T01:00:00.000Z",
      available: true,
    });
    expect(res.body.every((s: { available: boolean }) => s.available)).toBe(true);
  });

  test("работает без параметров from/to, используя 14-дневное окно", async () => {
    const et = await seedEventType(app, "Созвон", 30);
    const res = await request(app.server)
      .get(`/api/v1/event-types/${et.id}/slots`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(new Set(res.body.map((s: { startAt: string }) => s.startAt)).size).toBe(
      res.body.length,
    );
  });

  test("бронь другого типа события делает слот недоступным", async () => {
    const et1 = await seedEventType(app, "Созвон", 60);
    await seedEventType(app, "Интервью", 60);
    const startAt = localDateWithOffset(1, 10, 0);
    const from = new Date(startAt);
    from.setHours(0, 0, 0, 0);
    const to = new Date(startAt);
    to.setDate(to.getDate() + 1);

    await request(app.server)
      .post("/api/v1/bookings")
      .set("accept", "application/json")
      .send({ eventTypeId: et1.id, guestName: "Аня", startAt: startAt.toISOString() })
      .expect(201);

    const res = await request(app.server)
      .get(`/api/v1/event-types/${et1.id}/slots?from=${from.toISOString()}&to=${to.toISOString()}`)
      .expect(200);
    expect(res.body.some((s: { startAt: string }) => s.startAt === startAt.toISOString())).toBe(
      true,
    );
    expect(
      res.body.find((s: { startAt: string }) => s.startAt === startAt.toISOString())?.available,
    ).toBe(false);
  });
});
