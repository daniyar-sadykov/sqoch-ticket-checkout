import { beforeEach, describe, expect, it } from 'vitest'

import { readSeats, setSeats } from '@/server/seats'

import { POST } from './route'

/**
 * Обработчик подтверждения целиком, а не только правила мест: модульные тесты
 * `server/seats.ts` знают про остаток, но не про коды ответа, форму тела и про
 * номер заказа, который на отказе тратиться не должен.
 */

function orderRequest(participantCount: number): Request {
  const participants = Array.from({ length: participantCount }, (_, index) => ({
    id: `participant-${index + 1}`,
    name: `Участник ${index + 1}`,
    age: '30',
  }))

  return new Request('http://localhost/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ participants, email: 'buyer@example.com' }),
  })
}

/** Цифровая часть номера `SQ-482913`. */
function orderNumberValue(orderNumber: string): number {
  return Number(orderNumber.slice('SQ-'.length))
}

beforeEach(() => {
  setSeats(12)
})

describe('POST /api/orders, мест хватает', () => {
  it('отдаёт номер заказа и уменьшенный остаток', async () => {
    const response = await POST(orderRequest(3))

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({ seatsLeft: 9 })
    expect(readSeats()).toBe(9)
  })

  it('номер заказа вида SQ- и шесть цифр', async () => {
    const response = await POST(orderRequest(1))
    const body = (await response.json()) as { orderNumber: string }

    expect(body.orderNumber).toMatch(/^SQ-\d{6}$/)
  })

  it('заказ ровно на остаток проходит и оставляет ноль', async () => {
    setSeats(3)
    const response = await POST(orderRequest(3))

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({ seatsLeft: 0 })
    expect(readSeats()).toBe(0)
  })
})

describe('POST /api/orders, мест не хватает', () => {
  it('отдаёт 409 с остатком и не списывает места', async () => {
    setSeats(1)
    const response = await POST(orderRequest(3))

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: 'SOLD_OUT', seatsLeft: 1 })
    expect(readSeats()).toBe(1)
  })

  it('нулевой остаток отказывает даже одному участнику', async () => {
    setSeats(0)
    const response = await POST(orderRequest(1))

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: 'SOLD_OUT', seatsLeft: 0 })
    expect(readSeats()).toBe(0)
  })

  // На отказе заказа не возникает, поэтому и номер не тратится: иначе в
  // нумерации появились бы дыры от заказов, которых никогда не было.
  it('номер заказа на отказе не тратится', async () => {
    const before = (await (await POST(orderRequest(1))).json()) as { orderNumber: string }

    setSeats(0)
    expect((await POST(orderRequest(1))).status).toBe(409)

    setSeats(12)
    const after = (await (await POST(orderRequest(1))).json()) as { orderNumber: string }

    expect(orderNumberValue(after.orderNumber)).toBe(orderNumberValue(before.orderNumber) + 1)
  })
})

describe('POST /api/orders, тело не по форме', () => {
  it('не читается как JSON: 400 и места целы', async () => {
    const response = await POST(
      new Request('http://localhost/api/orders', { method: 'POST', body: '{' }),
    )

    expect(response.status).toBe(400)
    expect(readSeats()).toBe(12)
  })

  // Состав сверх границы отбивается до списания: иначе тело с десятью
  // участниками выгребло бы остаток, мимо правил заказа.
  it('участников больше четырёх: 400 и места целы', async () => {
    const response = await POST(orderRequest(10))

    expect(response.status).toBe(400)
    expect(readSeats()).toBe(12)
  })

  it('пустой состав: 400 и места целы', async () => {
    const response = await POST(
      new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants: [], email: 'buyer@example.com' }),
      }),
    )

    expect(response.status).toBe(400)
    expect(readSeats()).toBe(12)
  })
})
