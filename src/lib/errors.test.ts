import { describe, expect, it } from 'vitest'

import {
  ERROR_AGE_REQUIRED,
  ERROR_EMAIL_REQUIRED,
  ERROR_GUARDIAN_REQUIRED,
  ERROR_NAME_REQUIRED,
  validateOrder,
  type Order,
} from '@/domain/order'
import {
  EMAIL_FIELD_KEY,
  ageFieldKey,
  nameFieldKey,
  visibleEmailError,
  visibleOrderErrors,
  visibleParticipantErrors,
} from '@/lib/errors'

const EMPTY: Order = { participants: [{ id: 'p1', name: '', age: '' }], email: '' }

function touched(...keys: string[]): ReadonlySet<string> {
  return new Set(keys)
}

describe('visibleParticipantErrors', () => {
  it('на нетронутых полях ничего не показывает', () => {
    const errors = validateOrder(EMPTY)
    expect(visibleParticipantErrors('p1', errors.participants.p1, touched())).toEqual({})
  })

  it('показывает ошибку только того поля, по которому уходил фокус', () => {
    const errors = validateOrder(EMPTY)
    expect(visibleParticipantErrors('p1', errors.participants.p1, touched(nameFieldKey('p1')))).toEqual({
      name: ERROR_NAME_REQUIRED,
    })
    expect(visibleParticipantErrors('p1', errors.participants.p1, touched(ageFieldKey('p1')))).toEqual({
      age: ERROR_AGE_REQUIRED,
    })
  })

  it('показывает оба текста, когда тронуты оба поля', () => {
    const errors = validateOrder(EMPTY)
    const visible = visibleParticipantErrors('p1', errors.participants.p1, touched(nameFieldKey('p1'), ageFieldKey('p1')))
    expect(visible).toEqual({ name: ERROR_NAME_REQUIRED, age: ERROR_AGE_REQUIRED })
  })

  it('снимает ошибку сразу, как только значение стало верным', () => {
    const fixed: Order = { participants: [{ id: 'p1', name: 'Аня', age: '30' }], email: 'a@b.ru' }
    const errors = validateOrder(fixed)
    expect(visibleParticipantErrors('p1', errors.participants.p1, touched(nameFieldKey('p1'), ageFieldKey('p1')))).toEqual(
      {},
    )
  })

  it('не путает поля разных участников', () => {
    const order: Order = {
      participants: [
        { id: 'p1', name: '', age: '30' },
        { id: 'p2', name: '', age: '10' },
      ],
      email: 'a@b.ru',
    }
    const errors = validateOrder(order)
    expect(visibleParticipantErrors('p2', errors.participants.p2, touched(nameFieldKey('p1')))).toEqual({})
    expect(visibleParticipantErrors('p1', errors.participants.p1, touched(nameFieldKey('p1')))).toEqual({
      name: ERROR_NAME_REQUIRED,
    })
  })
})

describe('visibleEmailError', () => {
  it('молчит, пока по полю не уходил фокус', () => {
    expect(visibleEmailError(validateOrder(EMPTY), touched())).toBeUndefined()
    expect(visibleEmailError(validateOrder(EMPTY), touched(nameFieldKey('p1')))).toBeUndefined()
  })

  it('показывает текст из правил после ухода фокуса', () => {
    expect(visibleEmailError(validateOrder(EMPTY), touched(EMAIL_FIELD_KEY))).toBe(ERROR_EMAIL_REQUIRED)
  })

  it('снимает текст, когда email стал верным', () => {
    const order: Order = { participants: [{ id: 'p1', name: 'Аня', age: '30' }], email: 'a@b.ru' }
    expect(visibleEmailError(validateOrder(order), touched(EMAIL_FIELD_KEY))).toBeUndefined()
  })
})

describe('visibleOrderErrors', () => {
  it('на только что открытой форме пусто', () => {
    expect(visibleOrderErrors(validateOrder(EMPTY), touched())).toEqual([])
  })

  it('показывается, как только тронуто хотя бы одно поле', () => {
    const order: Order = { participants: [{ id: 'p1', name: 'Аня', age: '10' }], email: 'a@b.ru' }
    expect(visibleOrderErrors(validateOrder(order), touched(ageFieldKey('p1')))).toEqual([ERROR_GUARDIAN_REQUIRED])
  })

  it('пропадает, когда в заказе появился участник от 18 лет', () => {
    const order: Order = {
      participants: [
        { id: 'p1', name: 'Аня', age: '10' },
        { id: 'p2', name: 'Пётр', age: '18' },
      ],
      email: 'a@b.ru',
    }
    expect(visibleOrderErrors(validateOrder(order), touched(ageFieldKey('p1'), ageFieldKey('p2')))).toEqual([])
  })

  it('возвращает список правил целиком, ничего не отбирая по виду', () => {
    const order: Order = { participants: [], email: 'a@b.ru' }
    expect(visibleOrderErrors(validateOrder(order), touched(EMAIL_FIELD_KEY))).toEqual(validateOrder(order).order)
  })
})
