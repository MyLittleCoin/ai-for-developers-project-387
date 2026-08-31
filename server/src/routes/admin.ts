import type { FastifyInstance } from "fastify";
import { badRequest, notFound } from "../errors.js";
import { Store } from "../store.js";
import type { EventTypeCreate } from "../types.js";

export function registerAdminRoutes(app: FastifyInstance, store: Store): void {
  app.get("/api/v1/admin/event-types", async () => store.listEventTypes());

  app.get<{ Params: { eventTypeId: string } }>(
    "/api/v1/admin/event-types/:eventTypeId",
    async (req) => {
      const eventType = store.getEventType(req.params.eventTypeId);
      if (!eventType) throw notFound("Тип события не найден");
      return eventType;
    },
  );

  app.post<{ Body: EventTypeCreate }>("/api/v1/admin/event-types", async (req) => {
    const body = req.body ?? ({} as EventTypeCreate);

    if (typeof body.name !== "string" || body.name.trim() === "") {
      throw badRequest("Название обязательно");
    }
    if (typeof body.description !== "string") {
      throw badRequest("Описание обязательно");
    }
    if (!Number.isInteger(body.durationMinutes) || body.durationMinutes < 1) {
      throw badRequest("Длительность должна быть целым числом больше нуля");
    }

    return store.createEventType({
      name: body.name.trim(),
      description: body.description,
      durationMinutes: body.durationMinutes,
    });
  });

  app.get<{ Querystring: { from?: string } }>("/api/v1/admin/bookings", async (req) => {
    const fromMs = req.query.from ? Date.parse(req.query.from) : NaN;
    const from = Number.isNaN(fromMs) ? Date.now() : fromMs;

    return store
      .listBookings()
      .filter((b) => Date.parse(b.startAt) >= from)
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  });
}
