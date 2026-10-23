import { beforeEach, describe, expect, it } from 'vitest'

import { readSeats, setSeats } from '@/server/seats'

import { GET, PUT } from './route'

/**
 * Маршрут остатка мест: чтение для шапки мероприятия и установка из
 * демонстрационной панели. Правила разбора проверены в `domain/seats.test.ts`,
 * здесь коды ответа и то, что непригодное значение остатком не становится.
 */

function putRequest(body: unknown): Request {
  return new Request('http://localhost/api/availability', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  setSeats(12)
})

describe('GET /api/availability', () => {
  it('отдаёт текущий остаток', async () => {
    await expect((await GET()).json()).resolves.toEqual({ seatsLeft: 12 })
  })

  it('отдаёт тот же ноль, что лежит в состоянии', async () => {
    setSeats(0)
    await expect((await GET()).json()).resolves.toEqual({ seatsLeft: 0 })
  })
})

describe('PUT /api/availability, значение принято', () => {
  it('числом', async () => {
    const response = await PUT(putRequest({ seatsLeft: 1 }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ seatsLeft: 1 })
    expect(readSeats()).toBe(1)
  })

  it('строкой из поля панели', async () => {
    await PUT(putRequest({ seatsLeft: '5' }))
    expect(readSeats()).toBe(5)
  })

  it('нулём', async () => {
    await PUT(putRequest({ seatsLeft: 0 }))
    expect(readSeats()).toBe(0)
  })
})

describe('PUT /api/availability, значение отбито', () => {
  // Остаток обязан остаться прежним: иначе непригодное значение из панели
  // обнуляло бы демонстрацию молча.
  it.each([
    ['нечисловое', 'пять'],
    ['дробное', '2.5'],
    ['отрицательное', -1],
    ['пустое', ''],
    ['не число и не строка', true],
  ])('%s: 400 и остаток прежний', async (_name, value) => {
    const response = await PUT(putRequest({ seatsLeft: value }))

    expect(response.status).toBe(400)
    expect(readSeats()).toBe(12)
  })

  it('тело не читается как JSON: 400 и остаток прежний', async () => {
    const response = await PUT(putRequest('{'))

    expect(response.status).toBe(400)
    expect(readSeats()).toBe(12)
  })
})
