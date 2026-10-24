/**
 * Правила заказа билетов. Чистый модуль: без React, без запросов, без DOM.
 *
 * Здесь живёт весь набор правил: цена и итог, проверка полей участника и
 * email, правило сопровождения и границы состава заказа. Модуль отвечает на
 * вопрос «что неверно» и всегда возвращает полный набор ошибок; когда их
 * показывать, решает форма.
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

/** Тексты ошибок, которые видит покупатель. */
export const ERROR_NAME_REQUIRED = 'Укажите имя'
export const ERROR_NAME_TOO_LONG = `Имя не длиннее ${MAX_NAME_LENGTH} символов`
export const ERROR_AGE_REQUIRED = 'Укажите возраст'
export const ERROR_AGE_NOT_INTEGER = 'Возраст указывается целым числом'
export const ERROR_AGE_OUT_OF_RANGE = `Возраст от ${MIN_AGE} до ${MAX_AGE} лет`
export const ERROR_EMAIL_REQUIRED = 'Укажите email'
export const ERROR_EMAIL_INVALID = 'Проверьте email'
export const ERROR_GUARDIAN_REQUIRED = `В заказе нужен участник от ${GUARDIAN_AGE} лет`
export const ERROR_TOO_MANY_PARTICIPANTS = `В заказе не больше ${MAX_PARTICIPANTS} участников`
export const ERROR_TOO_FEW_PARTICIPANTS = 'В заказе должен остаться хотя бы один участник'

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

export type ParticipantErrors = { name?: string; age?: string }

export type OrderErrors = {
  /** Ошибки полей по id участника. Участник без ошибок в объекте отсутствует. */
  participants: Record<string, ParticipantErrors>
  email?: string
  /** Ошибки уровня заказа: состав, сопровождающий. */
  order: string[]
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

function nameError(name: string): string | undefined {
  const value = name.trim()
  if (value === '') return ERROR_NAME_REQUIRED
  if (value.length > MAX_NAME_LENGTH) return ERROR_NAME_TOO_LONG
  return undefined
}

/**
 * Три разных текста на возраст: пусто, не целое число, вне границ. Ведущий
 * ноль идёт во вторую ветку: `07` не каноническая запись целого.
 */
function ageError(age: string): string | undefined {
  const value = age.trim()
  if (value === '') return ERROR_AGE_REQUIRED
  if (!/^\d+$/.test(value)) return ERROR_AGE_NOT_INTEGER
  if (value.length > 1 && value.startsWith('0')) return ERROR_AGE_NOT_INTEGER
  // Границы спрашиваются у parseAge: иначе они жили бы в двух местах.
  return parseAge(value) === null ? ERROR_AGE_OUT_OF_RANGE : undefined
}

/** Ошибки полей участника. У верного участника объект пустой. */
export function validateParticipant(participant: Participant): ParticipantErrors {
  const errors: ParticipantErrors = {}
  const name = nameError(participant.name)
  if (name !== undefined) errors.name = name
  const age = ageError(participant.age)
  if (age !== undefined) errors.age = age
  return errors
}

/**
 * Email проверяется по форме, а не по RFC: непустая часть до «собаки», ровно
 * одна «собака», домен минимум из двух непустых частей через точку, пробелов
 * нет.
 */
export function validateEmail(email: string): string | undefined {
  const value = email.trim()
  if (value === '') return ERROR_EMAIL_REQUIRED
  if (!/^[^\s@]+@[^\s@]+(?:\.[^\s@]+)+$/.test(value)) return ERROR_EMAIL_INVALID
  return undefined
}

/** Есть ли в заказе участник от 18 лет. Возраст 14-17 сопровождающим не считается. */
function hasGuardian(participants: Participant[]): boolean {
  return participants.some((participant) => {
    const age = parseAge(participant.age)
    return age !== null && age >= GUARDIAN_AGE
  })
}

/**
 * Все ошибки заказа разом: поля каждого участника, email и уровень заказа.
 * Участник без ошибок в `participants` отсутствует.
 */
export function validateOrder(order: Order): OrderErrors {
  const participants: Record<string, ParticipantErrors> = {}
  for (const participant of order.participants) {
    const errors = validateParticipant(participant)
    if (Object.keys(errors).length > 0) participants[participant.id] = errors
  }

  const orderErrors: string[] = []
  if (order.participants.length < MIN_PARTICIPANTS) orderErrors.push(ERROR_TOO_FEW_PARTICIPANTS)
  if (order.participants.length > MAX_PARTICIPANTS) orderErrors.push(ERROR_TOO_MANY_PARTICIPANTS)
  if (!hasGuardian(order.participants)) orderErrors.push(ERROR_GUARDIAN_REQUIRED)

  const errors: OrderErrors = { participants, order: orderErrors }
  const email = validateEmail(order.email)
  if (email !== undefined) errors.email = email
  return errors
}

export function isOrderValid(order: Order): boolean {
  const errors = validateOrder(order)
  return Object.keys(errors.participants).length === 0 && errors.email === undefined && errors.order.length === 0
}

export function canAddParticipant(participants: Participant[]): boolean {
  return participants.length < MAX_PARTICIPANTS
}

export function canRemoveParticipant(participants: Participant[]): boolean {
  return participants.length > MIN_PARTICIPANTS
}
