import type { components } from "./schema";
import { api } from "./client";
import { ApiError } from "./errors";

export type Booking = components["schemas"]["Booking"];
export type BookingCreate = components["schemas"]["BookingCreate"];
export type EventType = components["schemas"]["EventType"];
export type EventTypeCreate = components["schemas"]["EventTypeCreate"];
export type Slot = components["schemas"]["Slot"];

async function unwrap<T>(res: {
  data?: T;
  error?: { message?: string; code?: string };
  response: { status: number };
}): Promise<T> {
  if (!res.data) {
    throw new ApiError(
      res.response.status,
      res.error?.code,
      res.error?.message,
    );
  }
  return res.data;
}

export function listEventTypes() {
  return api.GET("/event-types").then(unwrap<EventType[]>);
}

export function listSlots(eventTypeId: string, from: string, to: string) {
  return api
    .GET("/event-types/{eventTypeId}/slots", {
      params: { path: { eventTypeId }, query: { from, to } },
    })
    .then(unwrap<Slot[]>);
}

export function createBooking(body: BookingCreate) {
  return api
    .POST("/bookings", {
      body,
      params: { header: { accept: "application/json" } },
    })
    .then(unwrap<Booking>);
}

export function adminListEventTypes() {
  return api.GET("/admin/event-types").then(unwrap<EventType[]>);
}

export function adminGetEventType(eventTypeId: string) {
  return api
    .GET("/admin/event-types/{eventTypeId}", {
      params: { path: { eventTypeId } },
    })
    .then(unwrap<EventType>);
}

export function adminCreateEventType(body: EventTypeCreate) {
  return api.POST("/admin/event-types", { body }).then(unwrap<EventType>);
}

export function adminListBookings(from: string) {
  return api
    .GET("/admin/bookings", { params: { query: { from } } })
    .then(unwrap<Booking[]>);
}

export function listMeetings(from: string) {
  return api
    .GET("/meetings", { params: { query: { from } } })
    .then(unwrap<Booking[]>);
}
