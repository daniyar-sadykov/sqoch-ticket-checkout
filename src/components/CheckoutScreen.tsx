import type { Participant, ParticipantErrors } from '@/domain/order'
import { EMAIL_FIELD_KEY } from '@/lib/errors'
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
  /** Остаток мест с сервера, для шапки мероприятия. null, пока ответа нет. */
  seatsLeft: number | null
  /** Уже видимые ошибки полей, по записи на каждого участника заказа. */
  participantErrors: Record<string, ParticipantErrors>
  emailError?: string
  /** Уже видимые ошибки уровня заказа, в порядке из правил. */
  orderErrors: string[]
  orderValid: boolean
  canAdd: boolean
  canRemove: boolean
  onParticipantChange: (id: string, patch: Partial<Pick<Participant, 'name' | 'age'>>) => void
  onEmailChange: (value: string) => void
  onFieldBlur: (key: string) => void
  onAddParticipant: () => void
  onRemoveParticipant: (id: string) => void
  /** Переход на экран проверки. Заказ отсюда больше не отправляется. */
  onSubmit: () => void
}

/** Id кнопки добавления: на неё переносится фокус после удаления участника. */
export const ADD_PARTICIPANT_BUTTON_ID = 'add-participant'

/**
 * Экран оформления. Своих правил не придумывает: что неверно и что видно,
 * приходит готовым сверху, экран решает только раскладку.
 */
export function CheckoutScreen({
  participants,
  email,
  total,
  seatsLeft,
  participantErrors,
  emailError,
  orderErrors,
  orderValid,
  canAdd,
  canRemove,
  onParticipantChange,
  onEmailChange,
  onFieldBlur,
  onAddParticipant,
  onRemoveParticipant,
  onSubmit,
}: CheckoutScreenProps) {
  /**
   * Блок с кнопкой перехода стоит на экране дважды: в боковой сводке и в
   * прилипшей полосе. Каждому нужен свой id, иначе `aria-describedby` указывает
   * на два элемента разом.
   */
  function action(place: string) {
    const errorsId = `order-errors-${place}`
    const hasOrderErrors = orderErrors.length > 0

    return (
      <div>
        {hasOrderErrors ? (
          <ul id={errorsId} className="mb-3 space-y-1 text-sm text-danger">
            {orderErrors.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        ) : null}
        <Button
          onClick={onSubmit}
          ariaDisabled={!orderValid}
          ariaDescribedBy={hasOrderErrors ? errorsId : undefined}
        >
          Перейти к подтверждению
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Запас под прилипшую полосу держит страница: после формы идёт
          демонстрационная панель, и накрыло бы полосой именно её. */}
      <main className="mx-auto w-full max-w-5xl px-4 pt-8 pb-12">
        <h1 tabIndex={-1} className="text-2xl font-semibold sm:text-3xl">
          Оформление билетов
        </h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="space-y-6">
            <EventHeader seatsLeft={seatsLeft} />

            <ul className="space-y-4">
              {participants.map((participant, index) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  index={index}
                  errors={participantErrors[participant.id]}
                  canRemove={canRemove}
                  onChange={onParticipantChange}
                  onFieldBlur={onFieldBlur}
                  onRemove={onRemoveParticipant}
                />
              ))}
            </ul>

            <Button
              id={ADD_PARTICIPANT_BUTTON_ID}
              variant="secondary"
              block={false}
              disabled={!canAdd}
              onClick={onAddParticipant}
            >
              Добавить участника
            </Button>

            <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Контакт для билетов</h2>
              <div className="mt-4 max-w-md">
                <TextField
                  id="order-email"
                  label="Email для билетов"
                  value={email}
                  onChange={onEmailChange}
                  onBlur={() => onFieldBlur(EMAIL_FIELD_KEY)}
                  error={emailError}
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
            <OrderSummary participants={participants} total={total} action={action('aside')} />
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-surface px-4 py-3 lg:hidden">
        <p className="mb-2 flex items-baseline justify-between text-base font-semibold">
          <span>Итого</span>
          <span>{formatRub(total)}</span>
        </p>
        {action('bar')}
      </div>
    </>
  )
}
