import { beforeEach, describe, expect, it } from 'vitest'

import { START_SEATS } from '@/domain/seats'
import { readSeats, setSeats, takeSeats } from '@/server/seats'

// Остаток живёт в модуле, поэтому каждый тест начинает с известного числа.
beforeEach(() => {
  setSeats(START_SEATS)
})

describe('readSeats', () => {
  it('отдаёт текущий остаток', () => {
    expect(readSeats()).toBe(START_SEATS)
  })
})

describe('setSeats', () => {
  it('задаёт остаток и отдаёт принятое число', () => {
    expect(setSeats(5)).toBe(5)
    expect(readSeats()).toBe(5)
  })

  it('принимает ноль', () => {
    setSeats(0)
    expect(readSeats()).toBe(0)
  })
})

describe('takeSeats', () => {
  it('списывает ровно число участников', () => {
    expect(takeSeats(3)).toEqual({ taken: true, seatsLeft: 9 })
    expect(readSeats()).toBe(9)
  })

  it('два вызова подряд списывают дважды', () => {
    takeSeats(3)
    expect(takeSeats(2)).toEqual({ taken: true, seatsLeft: 7 })
    expect(readSeats()).toBe(7)
  })

  it('списывает остаток до нуля, когда мест ровно столько же', () => {
    setSeats(3)
    expect(takeSeats(3)).toEqual({ taken: true, seatsLeft: 0 })
    expect(readSeats()).toBe(0)
  })

  // Главный риск стори: на отказе места не должны уйти.
  it('при нехватке отказывает и оставляет остаток прежним', () => {
    setSeats(1)
    expect(takeSeats(3)).toEqual({ taken: false, seatsLeft: 1 })
    expect(readSeats()).toBe(1)
  })

  it('при нулевом остатке отказывает и оставляет ноль', () => {
    setSeats(0)
    expect(takeSeats(1)).toEqual({ taken: false, seatsLeft: 0 })
    expect(readSeats()).toBe(0)
  })

  it('отказ не мешает следующей попытке после поднятия остатка', () => {
    setSeats(1)
    takeSeats(3)
    setSeats(5)
    expect(takeSeats(3)).toEqual({ taken: true, seatsLeft: 2 })
    expect(readSeats()).toBe(2)
  })
})
