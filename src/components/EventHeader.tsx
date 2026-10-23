import { EVENT } from '@/lib/event'

type EventHeaderProps = {
  /**
   * Остаток мест с сервера. null, пока ответа нет: строки остатка тогда просто
   * нет, числа своей выдумки шапка не показывает.
   */
  seatsLeft: number | null
}

/** Шапка мероприятия. Одна и та же на оформлении и на проверке заказа. */
export function EventHeader({ seatsLeft }: EventHeaderProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-xl font-semibold sm:text-2xl">{EVENT.title}</h2>
      <p className="mt-2 text-sm text-muted sm:text-base">{EVENT.date}</p>
      <p className="text-sm text-muted sm:text-base">{EVENT.place}</p>
      {seatsLeft === null ? null : (
        <p className="mt-2 text-sm font-medium sm:text-base">Осталось мест: {seatsLeft}</p>
      )}
    </section>
  )
}
