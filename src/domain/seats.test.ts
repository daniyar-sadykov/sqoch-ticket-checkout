import { describe, expect, it } from 'vitest'

import { START_SEATS, hasEnoughSeats, parseSeats } from '@/domain/seats'

describe('START_SEATS', () => {
  it('стартовый остаток из спецификации экранов', () => {
    expect(START_SEATS).toBe(12)
  })
})

describe('hasEnoughSeats', () => {
  it('остаток больше числа участников', () => {
    expect(hasEnoughSeats(12, 3)).toBe(true)
  })

  it('остаток ровно равен числу участников', () => {
    expect(hasEnoughSeats(3, 3)).toBe(true)
    expect(hasEnoughSeats(1, 1)).toBe(true)
  })

  it('остаток меньше числа участников', () => {
    expect(hasEnoughSeats(1, 3)).toBe(false)
    expect(hasEnoughSeats(2, 3)).toBe(false)
  })

  it('остаток ноль не хватает ни одному участнику', () => {
    expect(hasEnoughSeats(0, 1)).toBe(false)
    expect(hasEnoughSeats(0, 4)).toBe(false)
  })

  // Один участник занимает одно место независимо от типа билета, поэтому
  // правило знает только два числа и ни про детский билет, ни про цену.
  it('заказ без участников мест не занимает', () => {
    expect(hasEnoughSeats(0, 0)).toBe(true)
  })
})

describe('parseSeats', () => {
  it('читает целое число', () => {
    expect(parseSeats('12')).toBe(12)
    expect(parseSeats('1')).toBe(1)
  })

  it('читает ноль', () => {
    expect(parseSeats('0')).toBe(0)
  })

  it('не читает пустое значение и пробелы', () => {
    expect(parseSeats('')).toBeNull()
    expect(parseSeats('   ')).toBeNull()
  })

  it('читает значение с пробелами по краям', () => {
    expect(parseSeats('  5  ')).toBe(5)
  })

  it('не читает нечисловое', () => {
    expect(parseSeats('пять')).toBeNull()
    expect(parseSeats('5 мест')).toBeNull()
    expect(parseSeats('1e3')).toBeNull()
  })

  it('не читает дробное', () => {
    expect(parseSeats('2.5')).toBeNull()
    expect(parseSeats('2,5')).toBeNull()
  })

  it('не читает отрицательное', () => {
    expect(parseSeats('-1')).toBeNull()
    expect(parseSeats('-12')).toBeNull()
  })

  it('не читает число за границей точного целого', () => {
    expect(parseSeats('9'.repeat(20))).toBeNull()
  })
})
