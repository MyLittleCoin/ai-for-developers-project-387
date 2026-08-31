import request from "supertest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

export async function createTestServer(): Promise<FastifyInstance> {
  const app = buildApp();
  await app.ready();
  return app;
}

export interface SeededEventType {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
}

export async function seedEventType(
  app: FastifyInstance,
  name = "Созвон",
  durationMinutes = 60,
): Promise<SeededEventType> {
  const res = await request(app.server)
    .post("/api/v1/admin/event-types")
    .send({ name, description: "Обсуждение проекта", durationMinutes });
  if (res.status !== 200) {
    throw new Error(`seedEventType failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body as SeededEventType;
}

export function localDateWithOffset(days: number, hours: number, minutes = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d;
}
