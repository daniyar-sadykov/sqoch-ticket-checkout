import { MAX_NAME_LENGTH, parseAge, type Participant } from '@/domain/order'
import { ticketLabelFor } from '@/lib/format'

import { TextField } from './TextField'

type ParticipantCardProps = {
  participant: Participant
  index: number
  onChange: (id: string, patch: Partial<Pick<Participant, 'name' | 'age'>>) => void
}

/**
 * Карточка участника заказа. Добавление, удаление и показ ошибок полей
 * добавляет стори 3.
 */
export function ParticipantCard({ participant, index, onChange }: ParticipantCardProps) {
  const age = parseAge(participant.age)

  return (
    <li className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <p className="text-sm font-medium text-muted">Участник {index + 1}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TextField
          id={`participant-${participant.id}-name`}
          label="Имя"
          value={participant.name}
          onChange={(name) => onChange(participant.id, { name })}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="off"
        />
        <TextField
          id={`participant-${participant.id}-age`}
          label="Возраст"
          value={participant.age}
          onChange={(value) => onChange(participant.id, { age: value })}
          inputMode="numeric"
          maxLength={3}
          autoComplete="off"
        />
      </div>

      {age === null ? null : <p className="mt-4 text-sm font-medium">{ticketLabelFor(age)}</p>}
    </li>
  )
}
