import { EVENT } from '@/lib/event'

/** Шапка мероприятия. Остаток свободных мест добавляет стори 5. */
export function EventHeader() {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-xl font-semibold sm:text-2xl">{EVENT.title}</h2>
      <p className="mt-2 text-sm text-muted sm:text-base">{EVENT.date}</p>
      <p className="text-sm text-muted sm:text-base">{EVENT.place}</p>
    </section>
  )
}
