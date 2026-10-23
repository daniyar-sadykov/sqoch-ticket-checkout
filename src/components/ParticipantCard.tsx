import { parseAge, type Participant, type ParticipantErrors } from '@/domain/order'
import { ageFieldKey, nameFieldKey } from '@/lib/errors'
import { ticketLabelFor } from '@/lib/format'

import { Button } from './Button'
import { TextField } from './TextField'

type ParticipantCardProps = {
  participant: Participant
  index: number
  errors: ParticipantErrors
  /** Можно ли удалить участника: граница состава это правило заказа, а не длина массива. */
  canRemove: boolean
  onChange: (id: string, patch: Partial<Pick<Participant, 'name' | 'age'>>) => void
  onFieldBlur: (key: string) => void
  onRemove: (id: string) => void
}

/**
 * Id поля в разметке. Собирается в одном месте: по нему форма переносит фокус
 * на поле «Имя» новой карточки.
 */
export const participantFieldId = (id: string, field: 'name' | 'age') => `participant-${id}-${field}`

/** Карточка участника заказа: поля, подпись типа билета, удаление. */
export function ParticipantCard({
  participant,
  index,
  errors,
  canRemove,
  onChange,
  onFieldBlur,
  onRemove,
}: ParticipantCardProps) {
  const age = parseAge(participant.age)

  return (
    <li className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">Участник {index + 1}</p>
        <Button
          variant="secondary"
          block={false}
          disabled={!canRemove}
          ariaLabel={`Удалить участника ${index + 1}`}
          onClick={() => onRemove(participant.id)}
        >
          Удалить
        </Button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TextField
          id={participantFieldId(participant.id, 'name')}
          label="Имя"
          value={participant.name}
          onChange={(name) => onChange(participant.id, { name })}
          onBlur={() => onFieldBlur(nameFieldKey(participant.id))}
          error={errors.name}
          autoComplete="off"
        />
        <TextField
          id={participantFieldId(participant.id, 'age')}
          label="Возраст"
          value={participant.age}
          onChange={(value) => onChange(participant.id, { age: value })}
          onBlur={() => onFieldBlur(ageFieldKey(participant.id))}
          error={errors.age}
          inputMode="numeric"
          maxLength={3}
          autoComplete="off"
        />
      </div>

      {age === null ? null : <p className="mt-4 text-sm font-medium">{ticketLabelFor(age)}</p>}
    </li>
  )
}
