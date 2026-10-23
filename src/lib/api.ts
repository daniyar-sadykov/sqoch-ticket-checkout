import type { Order } from '@/domain/order'
import { parseSeats } from '@/domain/seats'

/**
 * Клиент мокового бэкенда.
 *
 * У отправки три исхода, и они разводятся полем `reason`, а не разбором
 * текста: экрану «мест не осталось» нужно число, а не сообщение, и путать
 * нехватку мест с упавшей сетью нельзя.
 *
 * Остаток мест ни в одном исходе не вычисляется: это то число, которое
 * вернул сервер, либо null, когда его в ответе нет.
 */
export type SubmitOrderResult =
  | { ok: true; orderNumber: string; seatsLeft: number | null }
  | { ok: false; reason: 'no-seats'; seatsLeft: number }
  | { ok: false; reason: 'error'; message: string }

const FAILURE_MESSAGE = 'Не удалось оформить заказ. Попробуйте ещё раз.'

/** Остаток из тела ответа. null, когда поля нет или это не целое число. */
function readSeatsLeft(body: unknown): number | null {
  if (typeof body !== 'object' || body === null || !('seatsLeft' in body)) return null
  const value = body.seatsLeft
  if (typeof value !== 'number') return null
  return Number.isSafeInteger(value) && value >= 0 ? value : null
}

export async function submitOrder(order: Order): Promise<SubmitOrderResult> {
  let response: Response

  try {
    response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })
  } catch {
    return { ok: false, reason: 'error', message: FAILURE_MESSAGE }
  }

  const body: unknown = await response.json().catch(() => null)
  const seatsLeft = readSeatsLeft(body)

  if (
    response.ok &&
    typeof body === 'object' &&
    body !== null &&
    'orderNumber' in body &&
    typeof body.orderNumber === 'string'
  ) {
    return { ok: true, orderNumber: body.orderNumber, seatsLeft }
  }

  // Нехватка мест узнаётся по остатку в ответе: без числа показывать на экране
  // отказа нечего, поэтому такой ответ идёт отказом общего вида.
  if (response.status === 409 && seatsLeft !== null) {
    return { ok: false, reason: 'no-seats', seatsLeft }
  }

  return { ok: false, reason: 'error', message: FAILURE_MESSAGE }
}

/** Текущий остаток мест. null, когда запрос упал или ответ не по форме. */
export async function fetchSeats(): Promise<number | null> {
  try {
    const response = await fetch('/api/availability')
    if (!response.ok) return null
    return readSeatsLeft(await response.json())
  } catch {
    return null
  }
}

/**
 * Остаток из демонстрационной панели. На вход идёт то, что набрано в поле:
 * непригодное значение отбивается правилами мест и до сервера не доходит.
 *
 * Возвращает принятый сервером остаток либо null, и null означает только
 * «принятого числа нет»: значение не прошло правила, запрос упал, сервер
 * ответил не `ok` или в ответе нет числа. Какой из четырёх случаев это был,
 * вызывающему не сообщается.
 */
export async function applySeats(raw: string): Promise<number | null> {
  const seats = parseSeats(raw)
  if (seats === null) return null

  try {
    const response = await fetch('/api/availability', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatsLeft: seats }),
    })
    if (!response.ok) return null
    return readSeatsLeft(await response.json())
  } catch {
    return null
  }
}
