export class ApiError extends Error {
  status: number;
  code: string | undefined;

  constructor(status: number, code: string | undefined, message?: string) {
    super(message ?? `API error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const messages: Record<number, string> = {
  400: "Неверные данные",
  404: "Не найдено",
  409: "Слот уже занят",
};

export function errorToMessage(err: unknown): string {
  if (err instanceof ApiError && messages[err.status]) {
    return messages[err.status];
  }
  return "Ошибка сервера";
}
