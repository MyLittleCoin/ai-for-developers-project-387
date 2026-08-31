export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message: string): ApiError =>
  new ApiError(400, "bad_request", message);

export const notFound = (message: string): ApiError =>
  new ApiError(404, "not_found", message);

export const slotConflict = (message: string): ApiError =>
  new ApiError(409, "slot_conflict", message);
