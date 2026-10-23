import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Order } from '@/domain/order'
import { applySeats, fetchSeats, submitOrder } from '@/lib/api'

/**
 * Клиент мокового бэкенда: как читается ответ сервера. Здесь закрывается то
 * место, где остаток мог бы разойтись с сервером, и исходы отправки, которые
 * экран различает по `reason`, а не по тексту.
 */

const ORDER: Order = {
  participants: [{ id: 'participant-1', name: 'Анна', age: '30' }],
  email: 'anna@example.com',
}

function respondWith(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }))
}

function failing() {
  return vi.fn(async () => {
    throw new TypeError('network down')
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('submitOrder', () => {
  it('успех отдаёт номер и остаток из ответа', async () => {
    vi.stubGlobal('fetch', respondWith(201, { orderNumber: 'SQ-482913', seatsLeft: 9 }))

    await expect(submitOrder(ORDER)).resolves.toEqual({
      ok: true,
      orderNumber: 'SQ-482913',
      seatsLeft: 9,
    })
  })

  it('нехватка мест отдаёт остаток сервера, а не своё число', async () => {
    vi.stubGlobal('fetch', respondWith(409, { error: 'SOLD_OUT', seatsLeft: 1 }))

    await expect(submitOrder(ORDER)).resolves.toEqual({ ok: false, reason: 'no-seats', seatsLeft: 1 })
  })

  it('нехватка мест с нулевым остатком читается, а не теряется', async () => {
    vi.stubGlobal('fetch', respondWith(409, { error: 'SOLD_OUT', seatsLeft: 0 }))

    await expect(submitOrder(ORDER)).resolves.toEqual({ ok: false, reason: 'no-seats', seatsLeft: 0 })
  })

  // Без числа экрану «мест не осталось» показывать нечего, поэтому такой ответ
  // идёт отказом общего вида, а не исходом по местам с выдуманным остатком.
  it('409 без остатка в теле становится отказом общего вида', async () => {
    vi.stubGlobal('fetch', respondWith(409, { error: 'SOLD_OUT' }))

    const result = await submitOrder(ORDER)
    expect(result).toMatchObject({ ok: false, reason: 'error' })
  })

  it('упавшая сеть не путается с нехваткой мест', async () => {
    vi.stubGlobal('fetch', failing())

    const result = await submitOrder(ORDER)
    expect(result).toMatchObject({ ok: false, reason: 'error' })
  })

  it('ответ не по форме становится отказом общего вида', async () => {
    vi.stubGlobal('fetch', respondWith(500, { error: 'BOOM' }))

    const result = await submitOrder(ORDER)
    expect(result).toMatchObject({ ok: false, reason: 'error' })
  })
})

describe('fetchSeats', () => {
  it('отдаёт остаток сервера', async () => {
    vi.stubGlobal('fetch', respondWith(200, { seatsLeft: 11 }))

    await expect(fetchSeats()).resolves.toBe(11)
  })

  it('отдаёт ноль, а не «ничего»', async () => {
    vi.stubGlobal('fetch', respondWith(200, { seatsLeft: 0 }))

    await expect(fetchSeats()).resolves.toBe(0)
  })

  // Остаток остаётся неизвестным, и строки в шапке тогда просто нет: своего
  // числа шапка не придумывает.
  it('упавший запрос оставляет остаток неизвестным', async () => {
    vi.stubGlobal('fetch', failing())

    await expect(fetchSeats()).resolves.toBeNull()
  })

  it('ответ с ошибкой оставляет остаток неизвестным', async () => {
    vi.stubGlobal('fetch', respondWith(500, {}))

    await expect(fetchSeats()).resolves.toBeNull()
  })

  it('ответ без поля остатка оставляет остаток неизвестным', async () => {
    vi.stubGlobal('fetch', respondWith(200, { somethingElse: 7 }))

    await expect(fetchSeats()).resolves.toBeNull()
  })
})

describe('applySeats', () => {
  it('отдаёт принятый сервером остаток', async () => {
    vi.stubGlobal('fetch', respondWith(200, { seatsLeft: 3 }))

    await expect(applySeats('3')).resolves.toBe(3)
  })

  it.each(['', 'пять', '2.5', '-1'])('непригодное значение %s до сервера не доходит', async (raw) => {
    const stub = respondWith(200, { seatsLeft: 3 })
    vi.stubGlobal('fetch', stub)

    await expect(applySeats(raw)).resolves.toBeNull()
    expect(stub).not.toHaveBeenCalled()
  })

  it('отказ сервера показанный остаток не меняет', async () => {
    vi.stubGlobal('fetch', respondWith(400, { error: 'BAD_SEATS' }))

    await expect(applySeats('3')).resolves.toBeNull()
  })
})
