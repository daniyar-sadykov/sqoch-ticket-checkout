/**
 * Правила свободных мест. Чистый модуль: без React, без запросов, без DOM, как
 * `domain/order.ts`.
 *
 * Сам остаток здесь не хранится: его держит сервер (`server/seats.ts`). Здесь
 * только правила, которые нужны и серверу, и демонстрационной панели.
 */

/** Стартовый остаток мест из спецификации экранов, раздел 1. */
export const START_SEATS = 12

/**
 * Хватает ли остатка на заказ. Один участник занимает одно место независимо от
 * типа билета, поэтому про цену и детский билет правило ничего не знает.
 */
export function hasEnoughSeats(seatsLeft: number, participantCount: number): boolean {
  return seatsLeft >= participantCount
}

/**
 * Остаток из поля демонстрационной панели. Возвращает null, если это не целое
 * неотрицательное число: пустое значение, пробелы, нечисловое, дробное,
 * отрицательное или число за границей точного целого.
 *
 * Ведущий ноль разрешён, в отличие от возраста: поле панели служебное, и
 * придираться к записи `07` здесь не за что.
 */
export function parseSeats(raw: string): number | null {
  const value = raw.trim()
  if (!/^\d+$/.test(value)) return null
  const seats = Number(value)
  return Number.isSafeInteger(seats) ? seats : null
}
