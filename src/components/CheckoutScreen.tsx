import type { Participant } from '@/domain/order'
import { formatRub } from '@/lib/format'

import { Button } from './Button'
import { EventHeader } from './EventHeader'
import { ParticipantCard } from './ParticipantCard'
import { OrderSummary } from './OrderSummary'
import { TextField } from './TextField'

type CheckoutScreenProps = {
  participants: Participant[]
  email: string
  total: number
  submitting: boolean
  failure: string | null
  onParticipantChange: (id: string, patch: Partial<Pick<Participant, 'name' | 'age'>>) => void
  onEmailChange: (value: string) => void
  onSubmit: () => void
}

/**
 * Экран оформления. Добавление и удаление участников приходит в стори 3,
 * экран проверки заказа в стори 4.
 */
export function CheckoutScreen({
  participants,
  email,
  total,
  submitting,
  failure,
  onParticipantChange,
  onEmailChange,
  onSubmit,
}: CheckoutScreenProps) {
  const actionLabel = submitting ? 'Отправляем...' : 'Перейти к подтверждению'

  const action = (
    <div>
      {failure ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          {failure}
        </p>
      ) : null}
      <Button onClick={onSubmit} disabled={submitting}>
        {actionLabel}
      </Button>
    </div>
  )

  return (
    <>
      <main className="mx-auto w-full max-w-5xl px-4 pt-8 pb-32 lg:pb-12">
        <h1 tabIndex={-1} className="text-2xl font-semibold sm:text-3xl">
          Оформление билетов
        </h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="space-y-6">
            <EventHeader />

            <ul className="space-y-4">
              {participants.map((participant, index) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  index={index}
                  onChange={onParticipantChange}
                />
              ))}
            </ul>

            <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Контакт для билетов</h2>
              <div className="mt-4 max-w-md">
                <TextField
                  id="order-email"
                  label="Email для билетов"
                  value={email}
                  onChange={onEmailChange}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  hint="Один email на весь заказ."
                />
              </div>
            </section>

            <div className="lg:hidden">
              <OrderSummary participants={participants} total={total} />
            </div>
          </div>

          <aside className="hidden lg:sticky lg:top-8 lg:block">
            <OrderSummary participants={participants} total={total} action={action} />
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-surface px-4 py-3 lg:hidden">
        <p className="mb-2 flex items-baseline justify-between text-base font-semibold">
          <span>Итого</span>
          <span>{formatRub(total)}</span>
        </p>
        {action}
      </div>
    </>
  )
}
