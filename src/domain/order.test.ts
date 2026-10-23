import { describe, expect, it } from 'vitest'

import {
  CHILD_TICKET_PRICE,
  FULL_TICKET_PRICE,
  canAddParticipant,
  canRemoveParticipant,
  isOrderValid,
  orderTotal,
  parseAge,
  priceFor,
  ticketTypeFor,
  validateEmail,
  validateOrder,
  validateParticipant,
  type Order,
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

/** Участник с заданным id: в заказе из нескольких человек id должны различаться. */
function person(id: string, age: string, name = 'Участник'): Participant {
  return { id, name, age }
}

function order(participants: Participant[], email = 'a@b.ru'): Order {
  return { participants, email }
}

describe('validateParticipant: имя', () => {
  it('пустое имя и имя из одних пробелов', () => {
    expect(validateParticipant(person('p1', '30', '')).name).toBe('Укажите имя')
    expect(validateParticipant(person('p1', '30', '   ')).name).toBe('Укажите имя')
  })

  it('имя длиннее 60 символов', () => {
    expect(validateParticipant(person('p1', '30', 'я'.repeat(61))).name).toBe('Имя не длиннее 60 символов')
  })

  it('имя ровно в 60 символов проходит', () => {
    expect(validateParticipant(person('p1', '30', 'я'.repeat(60))).name).toBeUndefined()
  })
})

describe('validateParticipant: возраст', () => {
  it('возраст не задан', () => {
    expect(validateParticipant(person('p1', '')).age).toBe('Укажите возраст')
    expect(validateParticipant(person('p1', '   ')).age).toBe('Укажите возраст')
  })

  it('возраст не целое число', () => {
    for (const raw of ['abc', '7.5', '-3', '07']) {
      expect(validateParticipant(person('p1', raw)).age).toBe('Возраст указывается целым числом')
    }
  })

  it('возраст вне границ', () => {
    expect(validateParticipant(person('p1', '121')).age).toBe('Возраст от 0 до 120 лет')
  })

  it('возраст на верхней границе проходит', () => {
    expect(validateParticipant(person('p1', '120')).age).toBeUndefined()
  })

  it('верный участник не даёт ошибок', () => {
    expect(validateParticipant(person('p1', '30', 'Анна'))).toEqual({})
  })
})

describe('validateEmail', () => {
  it('пустой email', () => {
    expect(validateEmail('')).toBe('Укажите email')
    expect(validateEmail('  ')).toBe('Укажите email')
  })

  it('кривой email', () => {
    for (const raw of ['a@b', '@b.ru', 'a@@b.ru', 'a b@c.ru']) {
      expect(validateEmail(raw)).toBe('Проверьте email')
    }
  })

  it('верный email', () => {
    expect(validateEmail('a@b.ru')).toBeUndefined()
    expect(validateEmail('  a@b.ru  ')).toBeUndefined()
  })
})

describe('validateOrder: участник от 18 лет', () => {
  it('участники 10 и 17 лет не дают сопровождающего', () => {
    const current = order([person('p1', '10'), person('p2', '17')])
    const errors = validateOrder(current)
    expect(errors.order).toContain('В заказе нужен участник от 18 лет')
    expect(errors.participants).toEqual({})
    expect(isOrderValid(current)).toBe(false)
  })

  it('участники 10 и 18 лет дают валидный заказ', () => {
    const current = order([person('p1', '10'), person('p2', '18')])
    expect(validateOrder(current)).toEqual({ participants: {}, order: [] })
    expect(isOrderValid(current)).toBe(true)
  })

  it('заказ из одних подростков невалиден', () => {
    const current = order([person('p1', '14'), person('p2', '15'), person('p3', '17')])
    const errors = validateOrder(current)
    expect(errors.order).toEqual(['В заказе нужен участник от 18 лет'])
    expect(errors.participants).toEqual({})
    expect(errors.email).toBeUndefined()
    expect(isOrderValid(current)).toBe(false)
  })

  it('тот же заказ с одним совершеннолетним валиден', () => {
    const current = order([person('p1', '18'), person('p2', '15'), person('p3', '17')])
    expect(validateOrder(current)).toEqual({ participants: {}, order: [] })
    expect(isOrderValid(current)).toBe(true)
  })

  it('участник 17 лет платит полный билет, но сопровождающим не считается', () => {
    expect(priceFor(17)).toBe(FULL_TICKET_PRICE)
    expect(validateOrder(order([person('p1', '17')])).order).toContain('В заказе нужен участник от 18 лет')
  })
})

describe('validateOrder: состав заказа', () => {
  it('пятый участник не добавляется', () => {
    const four = [person('p1', '30'), person('p2', '31'), person('p3', '10'), person('p4', '11')]
    expect(canAddParticipant(four)).toBe(false)
    expect(canAddParticipant(four.slice(0, 3))).toBe(true)
    expect(validateOrder(order([...four, person('p5', '12')])).order).toContain('В заказе не больше 4 участников')
  })

  it('последний участник не удаляется', () => {
    const one = [person('p1', '30')]
    expect(canRemoveParticipant(one)).toBe(false)
    expect(canRemoveParticipant([...one, person('p2', '31')])).toBe(true)
    expect(validateOrder(order([])).order).toContain('В заказе должен остаться хотя бы один участник')
  })
})

describe('validateOrder: ошибки разом', () => {
  it('возвращает все ошибки сразу, каждую под своим участником и полем', () => {
    const current = order(
      [person('p1', 'abc', ''), person('p2', '30', 'Анна'), person('p3', '121', 'я'.repeat(61))],
      '',
    )
    const errors = validateOrder(current)
    expect(errors.participants).toEqual({
      p1: { name: 'Укажите имя', age: 'Возраст указывается целым числом' },
      p3: { name: 'Имя не длиннее 60 символов', age: 'Возраст от 0 до 120 лет' },
    })
    expect(errors.email).toBe('Укажите email')
    expect(isOrderValid(current)).toBe(false)
  })
})

describe('validateOrder: полный верный заказ', () => {
  it('два полных и два детских билета с верным email', () => {
    const participants = [
      person('p1', '30', 'Анна'),
      person('p2', '35', 'Борис'),
      person('p3', '10', 'Вера'),
      person('p4', '4', 'Глеб'),
    ]
    const current = order(participants, 'a@b.ru')
    expect(validateOrder(current)).toEqual({ participants: {}, order: [] })
    expect(isOrderValid(current)).toBe(true)
    expect(orderTotal(participants)).toBe(6000)
  })
})
