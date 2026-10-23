import type { Order } from '@/domain/order'

/**
 * Клиент мокового бэкенда. Исход «мест не осталось» добавляет стори 5.
 */
export type SubmitOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; message: string }

const FAILURE_MESSAGE = 'Не удалось оформить заказ. Попробуйте ещё раз.'

export async function submitOrder(order: Order): Promise<SubmitOrderResult> {
  let response: Response

  try {
    response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })
  } catch {
    return { ok: false, message: FAILURE_MESSAGE }
  }

  const body: unknown = await response.json().catch(() => null)

  if (
    response.ok &&
    typeof body === 'object' &&
    body !== null &&
    'orderNumber' in body &&
    typeof body.orderNumber === 'string'
  ) {
    return { ok: true, orderNumber: body.orderNumber }
  }

  return { ok: false, message: FAILURE_MESSAGE }
}
