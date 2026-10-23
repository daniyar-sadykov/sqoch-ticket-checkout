import { Button } from './Button'

type SoldOutScreenProps = {
  /** Остаток, который вернул сервер вместе с отказом. На клиенте не считается. */
  seatsLeft: number
  /** Повторная отправка в пути: обе кнопки закрыты, повтор показывает «Отправляем...». */
  submitting: boolean
  onEditOrder: () => void
  onRetry: () => void
}

/**
 * Экран результата «мест не осталось». Заказ не создан, места не списаны:
 * состав заказа цел в состоянии страницы, поэтому и правка состава, и повтор
 * того же заказа ничего не восстанавливают.
 */
export function SoldOutScreen({ seatsLeft, submitting, onEditOrder, onRetry }: SoldOutScreenProps) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-8 pb-12">
      <h1 tabIndex={-1} className="text-2xl font-semibold sm:text-3xl">
        Мест не осталось
      </h1>

      <div className="mt-6 space-y-6">
        <p className="text-base">
          Пока вы оформляли заказ, свободных мест стало меньше, чем участников в заказе.
        </p>

        <p className="text-base font-medium">Свободных мест: {seatsLeft}</p>

        {/* Кнопки закрыты через `ariaDisabled`, как на экране проверки: второго
            запроса не будет, это держит обработчик, а фокус нажавшего остаётся
            на кнопке до ответа сервера. */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onEditOrder} variant="secondary" ariaDisabled={submitting}>
            Изменить состав
          </Button>
          <Button onClick={onRetry} ariaDisabled={submitting}>
            {submitting ? 'Отправляем...' : 'Попробовать снова'}
          </Button>
        </div>
      </div>
    </main>
  )
}
