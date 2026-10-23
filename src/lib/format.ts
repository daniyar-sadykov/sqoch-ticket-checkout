import { priceFor, ticketTypeFor, type TicketType } from '@/domain/order'

const NBSP = '\u00A0'

/** Сумма в рублях: разряды и знак рубля отделены неразрывным пробелом. */
export function formatRub(amount: number): string {
  const grouped = String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  return `${grouped}${NBSP}\u20BD`
}

/** Возраст с правильной формой слова: 1 год, 2 года, 5 лет. */
export function formatAge(age: number): string {
  const lastTwo = age % 100
  const last = age % 10
  if (lastTwo >= 11 && lastTwo <= 14) return `${age}${NBSP}лет`
  if (last === 1) return `${age}${NBSP}год`
  if (last >= 2 && last <= 4) return `${age}${NBSP}года`
  return `${age}${NBSP}лет`
}

export function ticketTypeLabel(type: TicketType): string {
  return type === 'child' ? 'Детский билет' : 'Полный билет'
}

/** Подпись билета по возрасту участника: тип и цена из модуля правил. */
export function ticketLabelFor(age: number): string {
  return `${ticketTypeLabel(ticketTypeFor(age))}, ${formatRub(priceFor(age))}`
}
