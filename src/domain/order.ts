/**
 * Правила заказа билетов. Чистый модуль: без React, без запросов, без DOM.
 *
 * Стори 1 держит здесь цену и итог. Правило сопровождения, границы состава
 * заказа и проверку полей добавляет стори 2.
 */

/** Младше этого возраста билет детский. */
export const CHILD_AGE = 14

/** От этого возраста участник считается сопровождающим. */
export const GUARDIAN_AGE = 18

export const MIN_PARTICIPANTS = 1
export const MAX_PARTICIPANTS = 4

export const MIN_AGE = 0
export const MAX_AGE = 120
export const MAX_NAME_LENGTH = 60

export const FULL_TICKET_PRICE = 2000
export const CHILD_TICKET_PRICE = 1000

export type TicketType = 'full' | 'child'

/** Участник заказа. Возраст хранится строкой: это то, что ввёл покупатель. */
export type Participant = {
  id: string
  name: string
  age: string
}

export type Order = {
  participants: Participant[]
  email: string
}

/**
 * Возраст из поля ввода. Возвращает null, если это не целое число в границах:
 * пустое значение, нечисловое, дробное, отрицательное, с ведущим нулём или
 * вне диапазона от MIN_AGE до MAX_AGE.
 */
export function parseAge(raw: string): number | null {
  const value = raw.trim()
  if (!/^\d+$/.test(value)) return null
  if (value.length > 1 && value.startsWith('0')) return null
  const age = Number(value)
  if (age < MIN_AGE || age > MAX_AGE) return null
  return age
}

export function ticketTypeFor(age: number): TicketType {
  return age < CHILD_AGE ? 'child' : 'full'
}

export function priceFor(age: number): number {
  return ticketTypeFor(age) === 'child' ? CHILD_TICKET_PRICE : FULL_TICKET_PRICE
}

/**
 * Итог заказа. Участник с незаполненным или неверным возрастом в итог не
 * входит: его билет ещё не определён.
 */
export function orderTotal(participants: Participant[]): number {
  return participants.reduce((total, participant) => {
    const age = parseAge(participant.age)
    return age === null ? total : total + priceFor(age)
  }, 0)
}
