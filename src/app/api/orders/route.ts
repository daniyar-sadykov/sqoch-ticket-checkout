import { NextResponse } from 'next/server'

/**
 * Моковый обработчик подтверждения заказа. Бэкенда нет, состояние живёт в
 * памяти процесса.
 *
 * Стори 1 создаёт заказ и выдаёт его номер. Повторную проверку правил заказа
 * добавляет стори 2, остаток мест и отказ при нехватке мест стори 5.
 */

const FIRST_ORDER_NUMBER = 482913

let nextOrderNumber = FIRST_ORDER_NUMBER

type OrderRequestBody = {
  participants?: unknown
  email?: unknown
}

function isWellFormed(body: OrderRequestBody): boolean {
  return (
    Array.isArray(body.participants) &&
    body.participants.length > 0 &&
    typeof body.email === 'string' &&
    body.email.trim() !== ''
  )
}

export async function POST(request: Request) {
  let body: OrderRequestBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'MALFORMED_BODY' }, { status: 400 })
  }

  if (!isWellFormed(body)) {
    return NextResponse.json({ error: 'MALFORMED_BODY' }, { status: 400 })
  }

  const orderNumber = `SQ-${nextOrderNumber}`
  nextOrderNumber += 1

  return NextResponse.json({ orderNumber }, { status: 201 })
}
