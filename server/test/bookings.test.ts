import { afterEach, beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import type { FastifyInstance } from "fastify";
import { createTestServer, localDateWithOffset, seedEventType } from "./helpers.js";

describe("POST /api/v1/bookings", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestServer();
  });

  afterEach(async () => {
    await app.close();
  });

  test("создаёт бронирование и возвращает 201 с полной записью", async () => {
    const et = await seedEventType(app, "Созвон", 60);
    const startAt = localDateWithOffset(1, 10, 0).toISOString();

    const res = await request(app.server)
      .post("/api/v1/bookings")
      .set("accept", "application/json")
      .send({ eventTypeId: et.id, guestName: "Аня", startAt });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      eventTypeId: et.id,
      guestName: "Аня",
      startAt,
    });
    expect(res.body.id).toBeTruthy();
    expect(Date.parse(res.body.endAt) - Date.parse(startAt)).toBe(60 * 60 * 1000);
  });

  test("возвращает 404 при неизвестном типе события", async () => {
    const res = await request(app.server)
      .post("/api/v1/bookings")
      .set("accept", "application/json")
      .send({
        eventTypeId: "missing",
        guestName: "Аня",
        startAt: localDateWithOffset(1, 10, 0).toISOString(),
      });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: "not_found", message: expect.any(String) });
  });

  test("возвращает 400 при пустом имени гостя", async () => {
    const et = await seedEventType(app);

    for (const guestName of [undefined, "", "   "]) {
      const res = await request(app.server)
        .post("/api/v1/bookings")
        .set("accept", "application/json")
        .send({ eventTypeId: et.id, guestName, startAt: localDateWithOffset(1, 10, 0).toISOString() });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("bad_request");
    }
  });

  test("возвращает 400 при startAt вне окна бронирования", async () => {
    const et = await seedEventType(app);

    const past = localDateWithOffset(-2, 10, 0);
    const tooFar = localDateWithOffset(20, 10, 0);

    for (const startAt of [past.toISOString(), tooFar.toISOString()]) {
      const res = await request(app.server)
        .post("/api/v1/bookings")
        .set("accept", "application/json")
        .send({ eventTypeId: et.id, guestName: "Аня", startAt });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("bad_request");
    }
  });

  test("возвращает 400 при startAt не в 30-минутной сетке", async () => {
    const et = await seedEventType(app);
    const startAt = localDateWithOffset(1, 10, 17).toISOString();

    const res = await request(app.server)
      .post("/api/v1/bookings")
      .set("accept", "application/json")
      .send({ eventTypeId: et.id, guestName: "Аня", startAt });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("bad_request");
  });

  test("возвращает 409 {code: slot_conflict}, если слот уже занят", async () => {
    const et = await seedEventType(app, "Созвон", 60);
    const startAt = localDateWithOffset(1, 10, 0).toISOString();

    const first = await request(app.server)
      .post("/api/v1/bookings")
      .set("accept", "application/json")
      .send({ eventTypeId: et.id, guestName: "Аня", startAt });
    expect(first.status).toBe(201);

    const conflict = await request(app.server)
      .post("/api/v1/bookings")
      .set("accept", "application/json")
      .send({ eventTypeId: et.id, guestName: "Борис", startAt });

    expect(conflict.status).toBe(409);
    expect(conflict.body).toEqual({ code: "slot_conflict", message: expect.any(String) });
  });

  test("возвращает 409 при занятом слоте другим типом события", async () => {
    const et1 = await seedEventType(app, "Созвон", 60);
    const et2 = await seedEventType(app, "Интервью", 60);
    const startAt = localDateWithOffset(1, 10, 0).toISOString();

    const first = await request(app.server)
      .post("/api/v1/bookings")
      .set("accept", "application/json")
      .send({ eventTypeId: et1.id, guestName: "Аня", startAt });
    expect(first.status).toBe(201);

    const conflict = await request(app.server)
      .post("/api/v1/bookings")
      .set("accept", "application/json")
      .send({ eventTypeId: et2.id, guestName: "Борис", startAt });

    expect(conflict.status).toBe(409);
    expect(conflict.body.code).toBe("slot_conflict");
  });

  test("разрешает соседнее бронирование встык (без перекрытия)", async () => {
    const et = await seedEventType(app, "Созвон", 60);
    const firstStart = localDateWithOffset(1, 10, 0);
    const nextStart = new Date(firstStart.getTime() + 60 * 60 * 1000);

    const first = await request(app.server)
      .post("/api/v1/bookings")
      .set("accept", "application/json")
      .send({ eventTypeId: et.id, guestName: "Аня", startAt: firstStart.toISOString() });
    expect(first.status).toBe(201);

    const next = await request(app.server)
      .post("/api/v1/bookings")
      .set("accept", "application/json")
      .send({ eventTypeId: et.id, guestName: "Борис", startAt: nextStart.toISOString() });

    expect(next.status).toBe(201);
  });

  test("после бронирования слот становится недоступным в списке слотов", async () => {
    const et = await seedEventType(app, "Созвон", 60);
    const startAt = localDateWithOffset(1, 10, 0);
    const from = new Date(startAt);
    from.setHours(0, 0, 0, 0);
    const to = new Date(startAt);
    to.setDate(to.getDate() + 1);

    const slotBefore = await request(app.server)
      .get(`/api/v1/event-types/${et.id}/slots?from=${from.toISOString()}&to=${to.toISOString()}`)
      .expect(200);
    const before = slotBefore.body as Array<{ startAt: string; available: boolean }>;
    expect(before.find((s) => s.startAt === startAt.toISOString())?.available).toBe(true);

    await request(app.server)
      .post("/api/v1/bookings")
      .set("accept", "application/json")
      .send({ eventTypeId: et.id, guestName: "Аня", startAt: startAt.toISOString() })
      .expect(201);

    const slotAfter = await request(app.server)
      .get(`/api/v1/event-types/${et.id}/slots?from=${from.toISOString()}&to=${to.toISOString()}`)
      .expect(200);
    const after = slotAfter.body as Array<{ startAt: string; available: boolean }>;
    expect(after.find((s) => s.startAt === startAt.toISOString())?.available).toBe(false);
  });
});
