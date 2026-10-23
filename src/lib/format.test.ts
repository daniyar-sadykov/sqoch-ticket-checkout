import { describe, expect, it } from 'vitest'

import { formatAge, formatRub, ticketLabelFor } from '@/lib/format'

const NBSP = '\u00A0'

describe('formatRub', () => {
  it('разделяет разряды и ставит знак рубля', () => {
    expect(formatRub(2000)).toBe(`2${NBSP}000${NBSP}\u20BD`)
    expect(formatRub(6000)).toBe(`6${NBSP}000${NBSP}\u20BD`)
    expect(formatRub(0)).toBe(`0${NBSP}\u20BD`)
  })
})

describe('formatAge', () => {
  it('ставит форму слова по последним цифрам', () => {
    expect(formatAge(1)).toBe(`1${NBSP}год`)
    expect(formatAge(2)).toBe(`2${NBSP}года`)
    expect(formatAge(5)).toBe(`5${NBSP}лет`)
    expect(formatAge(11)).toBe(`11${NBSP}лет`)
    expect(formatAge(14)).toBe(`14${NBSP}лет`)
    expect(formatAge(21)).toBe(`21${NBSP}год`)
    expect(formatAge(0)).toBe(`0${NBSP}лет`)
  })
})

describe('ticketLabelFor', () => {
  it('берёт тип и цену из модуля правил', () => {
    expect(ticketLabelFor(30)).toBe(`Полный билет, 2${NBSP}000${NBSP}\u20BD`)
    expect(ticketLabelFor(13)).toBe(`Детский билет, 1${NBSP}000${NBSP}\u20BD`)
  })
})
