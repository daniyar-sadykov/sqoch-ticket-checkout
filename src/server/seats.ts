import { START_SEATS, hasEnoughSeats } from '@/domain/seats'

/**
 * Остаток свободных мест мокового бэкенда. Единственный источник правды по
 * остатку: клиент его только спрашивает и показывает.
 *
 * Базы и файла состояния нет, остаток живёт в памяти процесса и сбрасывается
 * при перезапуске сервера. Это и есть моковость из требований. Импортировать
 * этот модуль можно только из маршрутов: текущее число больше никто не знает.
 */

let seatsLeft = START_SEATS

export type TakeSeatsResult = {
  /** Списание прошло. На отказе остаток не изменился. */
  taken: boolean
  /** Остаток после вызова: на успехе уменьшенный, на отказе прежний. */
  seatsLeft: number
}

export function readSeats(): number {
  return seatsLeft
}

/** Задаёт остаток. Нужен демонстрационной панели и тестам. */
export function setSeats(value: number): number {
  seatsLeft = value
  return seatsLeft
}

/**
 * Проверяет и списывает места одним куском. Проверка и списание неразделимы и
 * живут здесь, а не двумя вызовами из маршрута: между ними нет `await`,
 * поэтому одновременный второй заказ не успеет прочитать тот же остаток.
 */
export function takeSeats(count: number): TakeSeatsResult {
  if (!hasEnoughSeats(seatsLeft, count)) return { taken: false, seatsLeft }
  seatsLeft -= count
  return { taken: true, seatsLeft }
}
