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
        {/* Живая область это обёртка, а не сам список: роль на `<ul>` вытеснила
            бы его роль списка, и пункты остались бы без владельца. Обёртка
            стоит в разметке всегда, а причины появляются внутри неё: изменение
            внутри существующей области объявляется надёжнее, чем вставка самой
            области. Связку `aria-describedby` это не заменяет, её читают только
            при фокусе на кнопке.

            Роль `status`, а не `alert`: причины уровня заказа появляются не
            только по клику на закрытой кнопке, но и на первом же уходе фокуса
            из любого поля, и мелькают на каждом пересечении порога 18 при
            наборе возраста. `alert` перебивал бы речь посреди набора, `status`
            ждёт паузы. Решение владельца, раздел 6 плана решения. */}
        <div id={errorsId} role="status" className={hasOrderErrors ? 'mb-3' : ''}>
          {hasOrderErrors ? (
            <ul className="space-y-1 text-sm text-danger">
              {orderErrors.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          ) : null}
        </div>
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
    <main className="mx-auto w-full max-w-5xl px-4 pt-8 pb-12">
      <h1 tabIndex={-1} className="text-2xl font-semibold sm:text-3xl">
        Оформление билетов
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-6">
          <EventHeader seatsLeft={seatsLeft} />

          {/* Заголовок у блока участников такой же, как у соседей: без него
              обход по заголовкам шёл от мероприятия сразу к контакту, и
              карточки в этом обходе не встречались вовсе. Имени секция не
              получает: обход по заголовкам закрывает сам заголовок, а имя
              сделало бы блок ориентиром страницы, каким соседние секции с
              такими же заголовками не стали. Отступ `space-y-6`, как было у
              карточек и кнопки до заголовка. */}
          <section className="space-y-6">
            <h2 className="text-lg font-semibold">Участники</h2>

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
          </section>

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

      {/* Полоса лежит внутри `main`, хотя на экране висит поверх него: на
          телефоне в ней главная кнопка экрана, а вне ориентира страницы ей
          не место. Фиксированному положению родитель безразличен, ширину
          `main` она не наследует, но держится это на том, что ни один предок
          не задаёт `transform`, `filter`, `perspective`, `contain`,
          `will-change` или `backdrop-filter`: любой из них станет для полосы
          содержащим блоком, и она сядет внутрь `max-w-5xl`.

          Запас под полосу держит страница, а не `main`: после формы идёт
          демонстрационная панель, и накрыло бы полосой именно её. Запас на
          прокрутку к полю в фокусе стоит в `globals.css`. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-control-line bg-surface px-4 py-3 lg:hidden">
        <p className="mb-2 flex items-baseline justify-between text-base font-semibold">
          <span>Итого</span>
          <span>{formatRub(total)}</span>
        </p>
        {action('bar')}
      </div>
    </main>
  )
}
