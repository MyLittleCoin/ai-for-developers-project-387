import type { FastifyInstance } from "fastify";
import { badRequest, notFound, slotConflict } from "../errors.js";
import { bookingWindow, computeSlots, SLOT_STEP_MINUTES } from "../slots.js";
import { Store } from "../store.js";
import type { BookingCreateInput } from "../types.js";

export function registerGuestRoutes(app: FastifyInstance, store: Store): void {
  app.get("/api/v1/event-types", async () => store.listEventTypes());

  app.get<{ Querystring: { from?: string } }>("/api/v1/meetings", async (req) => {
    const fromMs = req.query.from ? Date.parse(req.query.from) : NaN;
    const from = Number.isNaN(fromMs) ? Date.now() : fromMs;

    return store
      .listBookings()
      .filter((b) => Date.parse(b.startAt) >= from)
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  });

  app.get<{
    Params: { eventTypeId: string };
    Querystring: { from?: string; to?: string };
  }>("/api/v1/event-types/:eventTypeId/slots", async (req) => {
    const eventType = store.getEventType(req.params.eventTypeId);
    if (!eventType) throw notFound("Тип события не найден");

    const { start, end } = bookingWindow();
    const from = req.query.from ? new Date(req.query.from) : start;
    const to = req.query.to ? new Date(req.query.to) : end;
    return computeSlots(
      eventType.id,
      eventType.durationMinutes,
      from,
      to,
      store.listBookings(),
    );
  });

  app.post<{ Body: BookingCreateInput }>("/api/v1/bookings", async (req, reply) => {
    const body = req.body ?? ({} as BookingCreateInput);

    const eventType = store.getEventType(body.eventTypeId);
    if (!eventType) throw notFound("Тип события не найден");

    if (typeof body.guestName !== "string" || body.guestName.trim() === "") {
      throw badRequest("Имя гостя обязательно");
    }

    const startMs = Date.parse(body.startAt);
    if (Number.isNaN(startMs)) throw badRequest("Невалидная дата начала встречи");

    const { start, end } = bookingWindow();
    if (startMs < start.getTime() || startMs >= end.getTime()) {
      throw badRequest("startAt вне окна записи");
    }

    const stepMs = SLOT_STEP_MINUTES * 60_000;
    if (startMs % stepMs !== 0) {
      throw badRequest("startAt должен попадать в 30-минутную сетку");
    }

    const endMs = startMs + eventType.durationMinutes * 60_000;
    const busy = store
      .listBookings()
      .some((b) => Date.parse(b.startAt) < endMs && Date.parse(b.endAt) > startMs);
    if (busy) throw slotConflict("Слот уже занят");

    const booking = store.createBooking(
      { eventTypeId: eventType.id, guestName: body.guestName.trim(), startAt: body.startAt },
      new Date(endMs).toISOString(),
    );
    reply.status(201);
    return booking;
  });
}
