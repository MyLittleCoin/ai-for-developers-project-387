import "@typespec/http";

@service(#{ title: "Calendar Booking Service" })
@server("/api/v1", "v1")
namespace CalendarBookingService;

using Http;

/**
 * Владелец календаря.
 *
 * Одиночный заранее заданный профиль. В проекте нет регистрации и
 * авторизации: этот профиль по умолчанию используется в админской части.
 * Как сущность API не выставляется — доступ к админским операциям
 * выражается путями `/admin`.
 */
@doc("Единственный предзаданный профиль владельца календаря")
model Owner {
  @doc("Идентификатор владельца, заранее заданный и неизменный")
  id: "default-owner";

  @doc("Отображаемое имя владельца")
  name: string;
}

/**
 * Тип события: вид записи, который создаёт владелец.
 * Название, описание и длительность видны гостю на странице видов брони.
 */
model EventType {
  @doc("Уникальный идентификатор типа события")
  id: string;

  @doc("Название, видимое гостю")
  name: string;

  @doc("Описание, видимое гостю")
  description: string;

  @doc("Длительность встречи в минутах, строго больше нуля")
  @minValue(1)
  durationMinutes: int32;
}

/**
 * Свободный слот: вычисляемое значение, не хранится.
 * Формируется из длительности типа события (шаг 30 минут, 24/7) без учёта
 * рабочих часов. Слот свободен, если на интервал [startAt, endAt) нет
 * ни одного бронирования — любого типа события.
 */
model Slot {
  @doc("Тип события, для которого рассчитан слот")
  eventTypeId: string;

  @doc("Начало слота в формате UTC")
  startAt: utcDateTime;

  @doc("Конец слота, вычисляется как startAt + длительность типа события")
  endAt: utcDateTime;

  @doc("Признак свободного слота")
  available: boolean;
}

/**
 * Бронирование: гость записывается на слот без аккаунта, оставляя имя.
 */
model Booking {
  @doc("Уникальный идентификатор бронирования")
  id: string;

  @doc("Тип события, на который записан гость")
  eventTypeId: string;

  @doc("Имя гостя")
  guestName: string;

  @doc("Начало встречи в формате UTC")
  startAt: utcDateTime;

  @doc("Конец встречи, вычисляется из длительности типа события")
  endAt: utcDateTime;
}

@doc("Данные для создания тип события владельцем")
model EventTypeCreate {
  @doc("Название, видимое гостю")
  name: string;

  @doc("Описание, видимое гостю")
  description: string;

  @doc("Длительность встречи в минутах, строго больше нуля")
  @minValue(1)
  durationMinutes: int32;
}

@doc("Данные для создания бронирования гостем")
model BookingCreate {
  @doc("Тип события, на который записывается гость")
  eventTypeId: string;

  @doc("Имя гостя, непустая строка")
  guestName: string;

  @doc("Начало встречи в формате UTC, внутри 14-дневного окна записи")
  startAt: utcDateTime;
}

@doc("Успешное создание бронирования: тело — созданная запись")
model BookingCreated {
  @statusCode statusCode: 201;
  @body booking: Booking;
}

/**
 * По умолчанию доступные слоты формируются на 14 дней, начиная с текущей
 * даты. Гость может записаться только на свободный слот из этого окна.
 */
const bookingWindowDays: int64 = 14;

@doc("Ошибка 400: невалидные входные данные или startAt вне окна записи")
@error
model BadRequestError {
  @statusCode statusCode: 400;
  code: "bad_request";
  message: string;
}

@doc("Ошибка 404: тип события не найден")
@error
model NotFoundError {
  @statusCode statusCode: 404;
  code: "not_found";
  message: string;
}

@doc("Ошибка 409: слот занят другой записью любого типа события")
@error
model ConflictError {
  @statusCode statusCode: 409;
  code: "slot_conflict";
  message: string;
}

/**
 * Публичный API гостя: ни авторизации, ни создания аккаунта не требуется.
 * Гость смотрит виды брони, выбирает свободный слот и создаёт бронирование.
 */
@route("/event-types")
namespace GuestEventTypes {
  @doc("Список видов брони: название, описание и длительность")
  @get
  op list(): EventType[];

  @doc("Свободные слоты типа события в 14-дневном окне от текущей даты")
  @route("/{eventTypeId}/slots")
  @get
  op listSlots(
    @path eventTypeId: string,
    @doc(
      "Начало интервала выборки. Не задано — берётся текущая дата (окно записи 14 дней)"
    )
    @query from?: utcDateTime,
    @doc(
      "Конец интервала выборки. Не задано — берётся текущая дата + 14 дней"
    )
    @query to?: utcDateTime,
  ): Slot[] | NotFoundError;
}

@route("/bookings")
namespace GuestBookings {
  @doc(
    "Создание бронирования на свободный слот. 201 — бронь создана, 409 — слот занят"
  )
  @post
  op create(
    @header accept: "application/json",
    @body booking: BookingCreate,
  ): BookingCreated | BadRequestError | NotFoundError | ConflictError;
}

@route("/meetings")
namespace GuestMeetings {
  @doc("Расписание предстоящих встреч, видимое гостю")
  @get
  op list(
    @doc(
      "Показать встречи, начиная с этого времени. Не задано — текущее время"
    )
    @query from?: utcDateTime,
  ): Booking[];
}

/**
 * Админский API владельца: одиночный предзаданный профиль без авторизации.
 * Управление типами событий и просмотр предстоящих встреч всех типов.
 */
@route("/admin/event-types")
namespace AdminEventTypes {
  @doc("Просмотр созданных типов событий")
  @get
  op list(): EventType[];

  @doc("Просмотр одного типа события")
  @route("/{eventTypeId}")
  @get
  op get(@path eventTypeId: string): EventType | NotFoundError;

  @doc("Создание типа события владельцем")
  @post
  op create(@body eventType: EventTypeCreate): EventType | BadRequestError;
}

@route("/admin/bookings")
namespace AdminBookings {
  @doc("Предстоящие встречи: единый список бронирований всех типов событий")
  @get
  op list(
    @doc(
      "Показать встречи, начиная с этого времени. Не задано — текущее время"
    )
    @query from?: utcDateTime,
  ): Booking[];
}
