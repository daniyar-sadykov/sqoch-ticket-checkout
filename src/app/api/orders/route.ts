import { NextResponse } from 'next/server'

import { MAX_PARTICIPANTS } from '@/domain/order'
import { takeSeats } from '@/server/seats'

/**
 * Моковый обработчик подтверждения заказа. Бэкенда нет, состояние живёт в
 * памяти процесса.
 *
 * Два исхода: номер заказа с уменьшенным остатком либо отказ по местам. Правила
 * заказа маршрут не повторяет, их держит `domain/order.ts` на клиенте; здесь
 * проверяется только форма тела, потому что от неё зависит, сколько мест уйдёт.
 */

const FIRST_ORDER_NUMBER = 482913

let nextOrderNumber = FIRST_ORDER_NUMBER

type OrderRequestBody = {
  participants?: unknown
  email?: unknown
}

/**
 * Граница состава проверяется и здесь, а не только на клиенте: остаток мест
 * серверный, и тело с десятью участниками списало бы десять мест.
 */
function isWellFormed(body: OrderRequestBody): body is { participants: unknown[]; email: string } {
  return (
    Array.isArray(body.participants) &&
    body.participants.length > 0 &&
    body.participants.length <= MAX_PARTICIPANTS &&
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

  // Один участник занимает одно место независимо от типа билета. Места берутся
  // до выдачи номера: на отказе заказа не возникает, поэтому и номер не тратится.
  const seats = takeSeats(body.participants.length)

  if (!seats.taken) {
    return NextResponse.json({ error: 'SOLD_OUT', seatsLeft: seats.seatsLeft }, { status: 409 })
  }

  const orderNumber = `SQ-${nextOrderNumber}`
  nextOrderNumber += 1

  return NextResponse.json({ orderNumber, seatsLeft: seats.seatsLeft }, { status: 201 })
}
