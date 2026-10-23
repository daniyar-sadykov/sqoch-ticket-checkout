import type { Participant } from '@/domain/order'

import { Button } from './Button'
import { OrderSummary } from './OrderSummary'

type SuccessScreenProps = {
  orderNumber: string
  participants: Participant[]
  email: string
  total: number
  onNewOrder: () => void
}

/** Экран успешного оформления. */
export function SuccessScreen({ orderNumber, participants, email, total, onNewOrder }: SuccessScreenProps) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-8 pb-12">
      <h1 tabIndex={-1} className="text-2xl font-semibold sm:text-3xl">
        Заказ оформлен
      </h1>
      <p className="mt-2 text-base text-muted">Номер заказа {orderNumber}</p>

      <div className="mt-6 space-y-6">
        <OrderSummary participants={participants} total={total} />

        {/* Email приходит от покупателя и может быть длинным без пробелов. */}
        <p className="text-sm text-muted wrap-anywhere">Билеты отправлены на {email}</p>

        <Button onClick={onNewOrder} variant="secondary" block={false}>
          Новый заказ
        </Button>
      </div>
    </main>
  )
}
