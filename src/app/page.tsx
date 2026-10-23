'use client'

import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import {
  canAddParticipant,
  canRemoveParticipant,
  isOrderValid,
  orderTotal,
  validateOrder,
  type Order,
  type Participant,
  type ParticipantErrors,
} from '@/domain/order'
import {
  ageFieldKey,
  allFieldKeys,
  nameFieldKey,
  visibleEmailError,
  visibleOrderErrors,
  visibleParticipantErrors,
  type Touched,
} from '@/lib/errors'
import { submitOrder } from '@/lib/api'

import { ADD_PARTICIPANT_BUTTON_ID, CheckoutScreen } from '@/components/CheckoutScreen'
import { participantFieldId } from '@/components/ParticipantCard'
import { ReviewScreen } from '@/components/ReviewScreen'
import { SuccessScreen } from '@/components/SuccessScreen'

/**
 * Сценарий оформления билетов.
 *
 * Здесь живёт всё состояние заказа: состав, поля, тронутые поля и исход
 * отправки. Правила не дублируются: верность спрашивается у `@/domain/order`,
 * видимость ошибок у `@/lib/errors`.
 *
 * Покупатель идёт оформление -> проверка -> результат. Экраны это состояние
 * одной страницы, а не маршруты: возврат с проверки ничего не восстанавливает,
 * потому что состав, email и тронутые поля остаются здесь нетронутыми, а
 * `CheckoutScreen` просто не рисуется. Исход «мест не осталось» добавляется к
 * результату в стори 5.
 */

type Screen =
  | { name: 'checkout' }
  | { name: 'review' }
  | { name: 'success'; orderNumber: string }

/**
 * Id первого участника задан константой, а не вычисляется: значение, разное на
 * сервере и на клиенте, ломает сверку разметки при гидратации. Счётчик
 * следующих id начинается с него и только растёт, поэтому номера удалённых
 * участников не переиспользуются и состояние полей не прилипает к чужой
 * карточке.
 */
const FIRST_PARTICIPANT_ID = 'participant-1'
const FIRST_PARTICIPANT_NUMBER = 1

function emptyParticipant(id = FIRST_PARTICIPANT_ID): Participant {
  return { id, name: '', age: '' }
}

function focusById(id: string) {
  document.getElementById(id)?.focus()
}

/** Тронутые поля удалённого участника больше ни на что не влияют. */
function forgetParticipant(touched: Touched, id: string): Touched {
  const next = new Set(touched)
  next.delete(nameFieldKey(id))
  next.delete(ageFieldKey(id))
  return next
}

export default function CheckoutPage() {
  const [participants, setParticipants] = useState<Participant[]>(() => [emptyParticipant()])
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState<Touched>(() => new Set<string>())
  const [screen, setScreen] = useState<Screen>({ name: 'checkout' })
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const lastParticipantNumber = useRef(FIRST_PARTICIPANT_NUMBER)

  const order: Order = { participants, email }
  const total = orderTotal(participants)

  // validateOrder чистый и дешёвый, поэтому зовётся на каждый рендер: никакого
  // второго, отстающего от полей набора ошибок в состоянии не держим.
  const errors = validateOrder(order)
  const participantErrors: Record<string, ParticipantErrors> = Object.fromEntries(
    participants.map((participant) => [
      participant.id,
      visibleParticipantErrors(participant.id, errors.participants[participant.id], touched),
    ]),
  )

  function markTouched(key: string) {
    setTouched((current) => (current.has(key) ? current : new Set(current).add(key)))
  }

  function changeParticipant(id: string, patch: Partial<Pick<Participant, 'name' | 'age'>>) {
    setFailure(null)
    setParticipants((current) =>
      current.map((participant) => (participant.id === id ? { ...participant, ...patch } : participant)),
    )
  }

  function changeEmail(value: string) {
    setFailure(null)
    setEmail(value)
  }

  function addParticipant() {
    if (!canAddParticipant(participants)) return

    lastParticipantNumber.current += 1
    const added = emptyParticipant(`participant-${lastParticipantNumber.current}`)

    setFailure(null)
    // Фокус переходит на поле новой карточки, поэтому разметка нужна сразу.
    flushSync(() => setParticipants((current) => [...current, added]))
    focusById(participantFieldId(added.id, 'name'))
  }

  function removeParticipant(id: string) {
    if (!canRemoveParticipant(participants)) return

    setFailure(null)
    flushSync(() => {
      setParticipants((current) => current.filter((participant) => participant.id !== id))
      setTouched((current) => forgetParticipant(current, id))
    })
    focusById(ADD_PARTICIPANT_BUTTON_ID)
  }

  /** Кнопка формы: проверить заказ и перейти на экран проверки, без запроса. */
  function goToReview() {
    // Закрытая кнопка дальше не ведёт, но и молчать ей нельзя: причина могла
    // остаться скрытой за нетронутым полем. Помечаем тронутыми все поля, и все
    // причины становятся видны разом.
    if (!isOrderValid(order)) {
      setTouched(allFieldKeys(participants))
      return
    }

    setFailure(null)
    setScreen({ name: 'review' })
  }

  /**
   * Кнопка экрана проверки: только отправка. Заказ заново не проверяется, на
   * этот экран попадают лишь валидным, а править его здесь нечем.
   */
  async function confirmOrder() {
    if (submitting) return

    setSubmitting(true)
    setFailure(null)

    const result = await submitOrder(order)

    setSubmitting(false)

    if (result.ok) {
      setScreen({ name: 'success', orderNumber: result.orderNumber })
      return
    }

    setFailure(result.message)
  }

  function startNewOrder() {
    setParticipants([emptyParticipant()])
    setEmail('')
    setTouched(new Set())
    setFailure(null)
    setScreen({ name: 'checkout' })
  }

  if (screen.name === 'review') {
    return (
      <ReviewScreen
        participants={participants}
        email={email}
        total={total}
        submitting={submitting}
        failure={failure}
        onEdit={() => setScreen({ name: 'checkout' })}
        onConfirm={confirmOrder}
      />
    )
  }

  if (screen.name === 'success') {
    return (
      <SuccessScreen
        orderNumber={screen.orderNumber}
        participants={participants}
        email={email}
        total={total}
        onNewOrder={startNewOrder}
      />
    )
  }

  return (
    <CheckoutScreen
      participants={participants}
      email={email}
      total={total}
      participantErrors={participantErrors}
      emailError={visibleEmailError(errors, touched)}
      orderErrors={visibleOrderErrors(errors, touched)}
      orderValid={isOrderValid(order)}
      canAdd={canAddParticipant(participants)}
      canRemove={canRemoveParticipant(participants)}
      onParticipantChange={changeParticipant}
      onEmailChange={changeEmail}
      onFieldBlur={markTouched}
      onAddParticipant={addParticipant}
      onRemoveParticipant={removeParticipant}
      onSubmit={goToReview}
    />
  )
}
