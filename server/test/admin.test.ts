import { afterEach, beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import type { FastifyInstance } from "fastify";
import { createTestServer, localDateWithOffset, seedEventType } from "./helpers.js";

describe("Admin event types", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestServer();
  });

  afterEach(async () => {
    await app.close();
  });

  test("POST /api/v1/admin/event-types создаёт тип с id и возвращает 200", async () => {
    const res = await request(app.server)
      .post("/api/v1/admin/event-types")
      .send({ name: "Демо", description: "Вводная встреча", durationMinutes: 30 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: "Демо",
      description: "Вводная встреча",
      durationMinutes: 30,
    });
    expect(res.body.id).toBeTruthy();
  });

  test("POST возвращает 400 при невалидных данных", async () => {
    const cases = [
      { name: "", description: "x", durationMinutes: 30 },
      { description: "x", durationMinutes: 30 },
      { name: "Демо", description: "x", durationMinutes: 0 },
      { name: "Демо", description: "x", durationMinutes: -5 },
    ];
    for (const body of cases) {
      const res = await request(app.server).post("/api/v1/admin/event-types").send(body);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("bad_request");
    }
  });

  test("GET /api/v1/admin/event-types возвращает список", async () => {
    await seedEventType(app, "Созвон", 60);
    const res = await request(app.server).get("/api/v1/admin/event-types").expect(200);
    expect(res.body).toHaveLength(1);
  });

  test("GET /api/v1/admin/event-types/:id возвращает один тип", async () => {
    const et = await seedEventType(app, "Созвон", 60);
    const res = await request(app.server)
      .get(`/api/v1/admin/event-types/${et.id}`)
      .expect(200);
    expect(res.body).toEqual(et);
  });

  test("GET /api/v1/admin/event-types/:id возвращает 404 для неизвестного id", async () => {
    const res = await request(app.server).get("/api/v1/admin/event-types/missing");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("not_found");
  });
});

describe("GET /api/v1/admin/bookings", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestServer();
  });

  afterEach(async () => {
    await app.close();
  });

  test("возвращает предстоящие встречи, отсортированные по startAt", async () => {
    const et = await seedEventType(app, "Созвон", 60);

    const base = localDateWithOffset(1, 10, 0).getTime();
    const slotMid = new Date(base).toISOString();
    const slotEarly = new Date(base - 60 * 60 * 1000).toISOString();
    const slotLate = new Date(base + 60 * 60 * 1000).toISOString();

    for (const startAt of [slotLate, slotEarly, slotMid]) {
      await request(app.server)
        .post("/api/v1/bookings")
        .set("accept", "application/json")
        .send({ eventTypeId: et.id, guestName: "Аня", startAt })
        .expect(201);
    }

    const from = new Date(base).toISOString();
    const res = await request(app.server)
      .get(`/api/v1/admin/bookings?from=${from}`)
      .expect(200);

    expect(
      res.body.map((b: { startAt: string }) => b.startAt),
    ).toEqual([slotMid, slotLate]);
  });

  test("без from показывает всё от текущего момента", async () => {
    const et = await seedEventType(app, "Созвон", 60);
    await request(app.server)
      .post("/api/v1/bookings")
      .set("accept", "application/json")
      .send({ eventTypeId: et.id, guestName: "Аня", startAt: localDateWithOffset(1, 10, 0).toISOString() })
      .expect(201);

    const res = await request(app.server).get("/api/v1/admin/bookings").expect(200);
    expect(res.body).toHaveLength(1);
  });
});
