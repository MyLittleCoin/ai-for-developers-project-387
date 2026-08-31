import { afterEach, beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import type { FastifyInstance } from "fastify";
import { createTestServer, localDateWithOffset, seedEventType } from "./helpers.js";

describe("GET /api/v1/meetings", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestServer();
  });

  afterEach(async () => {
    await app.close();
  });

  test("возвращает предстоящие встречи гость, отсортированные по startAt", async () => {
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
      .get(`/api/v1/meetings?from=${from}`)
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
      .send({
        eventTypeId: et.id,
        guestName: "Аня",
        startAt: localDateWithOffset(1, 10, 0).toISOString(),
      })
      .expect(201);

    const res = await request(app.server).get("/api/v1/meetings").expect(200);
    expect(res.body).toHaveLength(1);
  });
});
