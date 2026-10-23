import { NextResponse } from 'next/server'

import { parseSeats } from '@/domain/seats'
import { readSeats, setSeats } from '@/server/seats'

/**
 * Остаток свободных мест мокового бэкенда: `GET` отдаёт текущий, `PUT`
 * задаёт его из демонстрационной панели.
 *
 * Панель нужна, чтобы заказчик сам воспроизвёл исход «мест не осталось»:
 * иначе остаток пришлось бы вычерпывать настоящими заказами.
 */

type SeatsRequestBody = {
  seatsLeft?: unknown
}

export async function GET() {
  return NextResponse.json({ seatsLeft: readSeats() })
}

export async function PUT(request: Request) {
  let body: SeatsRequestBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'MALFORMED_BODY' }, { status: 400 })
  }

  // Значение проходит через те же правила, что и поле панели: нечисловое,
  // дробное и отрицательное остатком не становятся.
  const seats =
    typeof body.seatsLeft === 'number' || typeof body.seatsLeft === 'string'
      ? parseSeats(String(body.seatsLeft))
      : null

  if (seats === null) {
    return NextResponse.json({ error: 'BAD_SEATS' }, { status: 400 })
  }

  return NextResponse.json({ seatsLeft: setSeats(seats) })
}
