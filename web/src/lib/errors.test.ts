import { describe, expect, it } from "vitest";
import { ApiError, errorToMessage } from "./errors";

describe("errorToMessage", () => {
  it("maps contract codes to russian messages", () => {
    expect(errorToMessage(new ApiError(400, "bad_request", "x"))).toBe(
      "Неверные данные",
    );
    expect(errorToMessage(new ApiError(404, "not_found", "x"))).toBe(
      "Не найдено",
    );
    expect(errorToMessage(new ApiError(409, "slot_conflict", "x"))).toBe(
      "Слот уже занят",
    );
  });

  it("falls back to generic message", () => {
    expect(errorToMessage(new Error("boom"))).toBe("Ошибка сервера");
    expect(errorToMessage(new ApiError(500, undefined, "x"))).toBe(
      "Ошибка сервера",
    );
  });
});

describe("ApiError", () => {
  it("stores status and code", () => {
    const err = new ApiError(409, "slot_conflict", "занят");
    expect(err.status).toBe(409);
    expect(err.code).toBe("slot_conflict");
    expect(err.message).toBe("занят");
    expect(err).toBeInstanceOf(Error);
  });
});
