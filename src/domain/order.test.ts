import { describe, expect, it } from 'vitest'

import {
  CHILD_TICKET_PRICE,
  FULL_TICKET_PRICE,
  orderTotal,
  parseAge,
  priceFor,
  ticketTypeFor,
  type Participant,
} from '@/domain/order'

function participant(age: string, name = 'Участник'): Participant {
  return { id: `p-${age}-${name}`, name, age }
}

describe('parseAge', () => {
  it('читает целый возраст в границах', () => {
    expect(parseAge('0')).toBe(0)
    expect(parseAge('30')).toBe(30)
    expect(parseAge('120')).toBe(120)
  })

  it('не читает пустое значение и пробелы', () => {
    expect(parseAge('')).toBeNull()
    expect(parseAge('   ')).toBeNull()
  })

  it('не читает нечисловое, дробное и отрицательное', () => {
    expect(parseAge('тридцать')).toBeNull()
    expect(parseAge('7.5')).toBeNull()
    expect(parseAge('7,5')).toBeNull()
    expect(parseAge('-3')).toBeNull()
  })

  it('не читает ведущие нули, но читает одиночный ноль', () => {
    expect(parseAge('07')).toBeNull()
    expect(parseAge('0')).toBe(0)
  })

  it('не читает возраст вне границ', () => {
    expect(parseAge('121')).toBeNull()
  })
})

describe('ticketTypeFor', () => {
  it('младше 14 лет это детский билет', () => {
    expect(ticketTypeFor(0)).toBe('child')
    expect(ticketTypeFor(13)).toBe('child')
  })

  it('ровно 14 лет это уже полный билет', () => {
    expect(ticketTypeFor(14)).toBe('full')
  })

  it('возраст от 14 лет и старше это полный билет', () => {
    expect(ticketTypeFor(17)).toBe('full')
    expect(ticketTypeFor(18)).toBe('full')
    expect(ticketTypeFor(120)).toBe('full')
  })
})

describe('priceFor', () => {
  it('ставит цену по типу билета', () => {
    expect(priceFor(13)).toBe(CHILD_TICKET_PRICE)
    expect(priceFor(14)).toBe(FULL_TICKET_PRICE)
  })
})

describe('orderTotal', () => {
  it('складывает билеты участников', () => {
    expect(orderTotal([participant('30'), participant('35'), participant('10'), participant('4')])).toBe(6000)
  })

  it('не считает участника с неверным возрастом', () => {
    expect(orderTotal([participant('30'), participant(''), participant('abc')])).toBe(2000)
  })

  it('на пустом заказе даёт ноль', () => {
    expect(orderTotal([])).toBe(0)
  })
})
