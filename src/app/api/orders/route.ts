import { NextResponse } from 'next/server'

import { takeSeats } from '@/server/seats'

/**
 * Моковый обработчик подтверждения заказа. Бэкенда нет, состояние живёт в
 * памяти процесса.
 *
 * Стори 1 создаёт заказ и выдаёт его номер, стори 5 спрашивает остаток мест и
 * отказывает при нехватке. Повторную проверку правил заказа добавляет стори 2.
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

  // Один участник занимает одно место независимо от типа билета.
  const participantCount = (body.participants as unknown[]).length

  // Места берутся до выдачи номера: на отказе заказа не возникает, поэтому и
  // номер не тратится.
  const seats = takeSeats(participantCount)

  if (!seats.taken) {
    return NextResponse.json({ error: 'NO_SEATS', seatsLeft: seats.seatsLeft }, { status: 409 })
  }

  const orderNumber = `SQ-${nextOrderNumber}`
  nextOrderNumber += 1

  return NextResponse.json({ orderNumber, seatsLeft: seats.seatsLeft }, { status: 201 })
}
