'use client'

import { useState } from 'react'

import { parseSeats } from '@/domain/seats'

import { Button } from './Button'
import { TextField } from './TextField'

type DemoPanelProps = {
  /** Остаток задаётся сервером: панель отправляет значение и ждёт ответа. */
  onApply: (raw: string) => void
}

export const DEMO_SEATS_FIELD_ID = 'demo-seats'

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

  // Непригодное значение остатком не станет, и кнопка об этом говорит видом:
  // своего текста ошибки у служебного поля нет.
  const valid = parseSeats(value) !== null

  return (
    <section className="rounded-2xl border border-dashed border-line bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Демонстрация</h2>

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
          <Button onClick={() => onApply(value)} variant="secondary" block={false} ariaDisabled={!valid}>
            Применить
          </Button>
        </div>
      </div>
    </section>
  )
}
