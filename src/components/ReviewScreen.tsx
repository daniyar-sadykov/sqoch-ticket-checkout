import type { Participant } from '@/domain/order'

import { Button } from './Button'
import { EventHeader } from './EventHeader'
import { OrderSummary } from './OrderSummary'

type ReviewScreenProps = {
  participants: Participant[]
  email: string
  total: number
  /** Запрос в пути: обе кнопки закрыты, подтверждение показывает «Отправляем...». */
  submitting: boolean
  /** Текст отказа сервера. Показывается только здесь: отправка живёт на этом экране. */
  failure: string | null
  onEdit: () => void
  onConfirm: () => void
}

/**
 * Экран проверки заказа. Своей копии данных не держит: состав, email и итог
 * приходят из состояния страницы, поэтому возврат к правке ничего не теряет.
 */
export function ReviewScreen({
  participants,
  email,
  total,
  submitting,
  failure,
  onEdit,
  onConfirm,
}: ReviewScreenProps) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-8 pb-12">
      <h1 tabIndex={-1} className="text-2xl font-semibold sm:text-3xl">
        Проверьте заказ
      </h1>

      <div className="mt-6 space-y-6">
        <EventHeader />

        <OrderSummary participants={participants} total={total} />

        {/* Email приходит от покупателя и может быть длинным без пробелов. */}
        <p className="text-sm text-muted wrap-anywhere">Email для билетов: {email}</p>

        <div className="space-y-3">
          {failure ? (
            <p role="alert" className="text-sm text-danger">
              {failure}
            </p>
          ) : null}

          {/* Порядок в разметке и на экране один: подтверждение первым, правка
              второй. Пока запрос в пути, обе кнопки закрыты через
              `ariaDisabled`: второго заказа и ухода на форму не будет, это
              держат обработчики, а кнопки остаются в обходе табом, и фокус
              нажавшего не падает на `body` до ответа сервера. */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={onConfirm} ariaDisabled={submitting}>
              {submitting ? 'Отправляем...' : 'Подтвердить заказ'}
            </Button>
            <Button onClick={onEdit} variant="secondary" ariaDisabled={submitting}>
              Изменить
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
