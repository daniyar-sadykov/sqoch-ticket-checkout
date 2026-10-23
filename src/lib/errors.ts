/**
 * Видимость ошибок на форме. Чистый модуль: без React и без DOM.
 *
 * Что неверно, решает `@/domain/order`. Здесь решается только, что из его
 * полного набора покупатель уже должен видеть: ошибка поля ждёт первого ухода
 * фокуса из этого поля, ошибки уровня заказа ждут, пока тронуто хоть одно поле.
 */

import type { OrderErrors, ParticipantErrors } from '@/domain/order'

/** Ключи полей, по которым уже уходил фокус. */
export type Touched = ReadonlySet<string>

export const nameFieldKey = (id: string) => `${id}:name`
export const ageFieldKey = (id: string) => `${id}:age`

/** Email один на весь заказ, поэтому у его ключа нет id участника. */
export const EMAIL_FIELD_KEY = 'email'

/** Ошибки полей участника, которые уже можно показать. */
export function visibleParticipantErrors(
  id: string,
  errors: ParticipantErrors | undefined,
  touched: Touched,
): ParticipantErrors {
  if (errors === undefined) return {}

  const visible: ParticipantErrors = {}
  if (errors.name !== undefined && touched.has(nameFieldKey(id))) visible.name = errors.name
  if (errors.age !== undefined && touched.has(ageFieldKey(id))) visible.age = errors.age
  return visible
}

/** Ошибка email, если по полю уже уходил фокус. */
export function visibleEmailError(errors: OrderErrors, touched: Touched): string | undefined {
  return touched.has(EMAIL_FIELD_KEY) ? errors.email : undefined
}

/**
 * Ошибки уровня заказа. Список не отбирается по содержанию: какие правила в
 * нём живут, решает `validateOrder`.
 */
export function visibleOrderErrors(errors: OrderErrors, touched: Touched): string[] {
  return touched.size === 0 ? [] : errors.order
}
