import type { ReactNode } from 'react'

import { parseAge, type Participant } from '@/domain/order'
import { formatAge, formatRub, ticketLabelFor } from '@/lib/format'

type OrderSummaryProps = {
  participants: Participant[]
  total: number
  action?: ReactNode
}

function summaryLine(participant: Participant, index: number): string {
  const name = participant.name.trim() || `Участник ${index + 1}`
  const age = parseAge(participant.age)
  if (age === null) return `${name}, возраст не указан`
  return `${name}, ${formatAge(age)}, ${ticketLabelFor(age).toLowerCase()}`
}

/** Состав заказа и итоговая стоимость. */
export function OrderSummary({ participants, total, action }: OrderSummaryProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Ваш заказ</h2>

      {/* Имя приходит от покупателя и может быть одним словом во всю длину.
          Нужен именно `wrap-anywhere`: `break-words` переносит строку, но не
          уменьшает min-content колонки, и она всё равно даёт прокрутку. */}
      <ul className="mt-4 space-y-2 text-sm wrap-anywhere">
        {participants.map((participant, index) => (
          <li key={participant.id}>{summaryLine(participant, index)}</li>
        ))}
      </ul>

      <p className="mt-4 flex items-baseline justify-between border-t border-line pt-4 text-base font-semibold">
        <span>Итого</span>
        <span>{formatRub(total)}</span>
      </p>

      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  )
}
