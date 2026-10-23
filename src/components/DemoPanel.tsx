'use client'

import { useState } from 'react'

import { parseSeats } from '@/domain/seats'

import { Button } from './Button'
import { TextField } from './TextField'

type DemoPanelProps = {
  /** Остаток задаётся сервером: панель отправляет значение и ждёт ответа. */
  onApply: (raw: string) => void
}

const DEMO_SEATS_FIELD_ID = 'demo-seats'
const DEMO_HEADING_ID = 'demo-heading'

/**
 * Демонстрационная панель остатка мест. Отделена от интерфейса заказа и видна
 * всегда, в том числе в сборке: без неё исход «мест не осталось» не
 * воспроизвести, а задание требует его показать.
 *
 * Набранное значение панель только пересылает. Своего остатка она не держит:
 * число в шапке приходит из ответа сервера.
 */
export function DemoPanel({ onApply }: DemoPanelProps) {
  const [value, setValue] = useState('')

  // Непригодное значение остатком не станет, и кнопка об этом говорит видом.
  // Закрыта она нативно, а не через `ariaDisabled`: причины текстом у
  // служебного поля нет, а `ariaDisabled` в этом проекте заведён ровно затем,
  // чтобы причину читали по связке. Фокус при этом не теряется: значение
  // меняется только из поля, то есть когда фокус не на кнопке.
  const valid = parseSeats(value) !== null

  return (
    /* Панель стоит вне `main`, поэтому ей нужно имя: названная секция сама
       становится ориентиром, и содержимое не выпадает из обхода. */
    <section
      aria-labelledby={DEMO_HEADING_ID}
      className="rounded-2xl border border-dashed border-line bg-surface p-5 sm:p-6"
    >
      <h2 id={DEMO_HEADING_ID} className="text-lg font-semibold">
        Демонстрация
      </h2>

      <div className="mt-4 flex max-w-md flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <TextField
            id={DEMO_SEATS_FIELD_ID}
            label="Свободных мест"
            value={value}
            onChange={setValue}
            inputMode="numeric"
            hint="Блок для демонстрации сценария, когда места заканчиваются перед подтверждением."
          />
        </div>
        <div className="sm:pt-7">
          <Button onClick={() => onApply(value)} variant="secondary" block={false} disabled={!valid}>
            Применить
          </Button>
        </div>
      </div>
    </section>
  )
}
