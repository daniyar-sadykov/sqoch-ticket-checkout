'use client'

import { useEffect, useRef, useState } from 'react'
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
import { applySeats, fetchSeats, submitOrder } from '@/lib/api'

import { ADD_PARTICIPANT_BUTTON_ID, CheckoutScreen } from '@/components/CheckoutScreen'
import { DemoPanel } from '@/components/DemoPanel'
import { participantFieldId } from '@/components/ParticipantCard'
import { ReviewScreen } from '@/components/ReviewScreen'
import { SoldOutScreen } from '@/components/SoldOutScreen'
import { SuccessScreen } from '@/components/SuccessScreen'

/**
 * Сценарий оформления билетов.
 *
 * Здесь живёт всё состояние заказа: состав, поля, тронутые поля и исход
 * отправки. Правила не дублируются: верность спрашивается у `@/domain/order`,
 * видимость ошибок у `@/lib/errors`.
 *
 * Покупатель идёт оформление -> проверка -> результат. Экраны это состояние
 * одной страницы, а не маршруты: возврат с проверки и с отказа по местам ничего
 * не восстанавливает, потому что состав, email и тронутые поля остаются здесь
 * нетронутыми, а `CheckoutScreen` просто не рисуется.
 *
 * Остаток мест держит сервер. Здесь он только хранится как `number | null`:
 * `null` до первого ответа, дальше то число, которое пришло в ответе. Ни одно
 * число остатка на клиенте не вычисляется.
 */

type Screen =
  | { name: 'checkout' }
  | { name: 'review' }
  | { name: 'success'; orderNumber: string }
  /** Остаток из отказа сервера: экран показывает его, а не текущее состояние. */
  | { name: 'soldOut'; seatsLeft: number }

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
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null)

  const lastParticipantNumber = useRef(FIRST_PARTICIPANT_NUMBER)

  const order: Order = { participants, email }
  const total = orderTotal(participants)

  // Остаток спрашивается у сервера на монтаже. Запрос упал, значит остаток
  // остаётся неизвестным и строки в шапке просто нет: кнопки это не трогает,
  // нехватку мест определяет сервер в момент подтверждения.
  useEffect(() => {
    let cancelled = false

    void fetchSeats().then((seats) => {
      if (!cancelled && seats !== null) setSeatsLeft(seats)
    })

    return () => {
      cancelled = true
    }
  }, [])

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
   * Кнопка экрана проверки и кнопка «Попробовать снова» на экране отказа по
   * местам: только отправка. Заказ заново не проверяется, на эти экраны
   * попадают лишь валидным, а править его там нечем.
   *
   * Исходов три: номер заказа, нехватка мест и отказ общего вида. Остаток в
   * первых двух берётся из ответа сервера как есть.
   */
  async function confirmOrder() {
    if (submitting) return

    setSubmitting(true)
    setFailure(null)

    const result = await submitOrder(order)

    setSubmitting(false)

    if (result.ok) {
      if (result.seatsLeft !== null) setSeatsLeft(result.seatsLeft)
      setScreen({ name: 'success', orderNumber: result.orderNumber })
      return
    }

    if (result.reason === 'no-seats') {
      setSeatsLeft(result.seatsLeft)
      setScreen({ name: 'soldOut', seatsLeft: result.seatsLeft })
      return
    }

    // Отказ общего вида показывает экран проверки. С экрана отказа по местам
    // возвращаемся туда же: иначе сообщение некому показать.
    setFailure(result.message)
    setScreen({ name: 'review' })
  }

  /** Кнопки «Изменить» и «Изменить состав». Закрыты, пока запрос в пути: иначе
   *  ответ сервера догнал бы покупателя на форме и увёл на экран результата. */
  function backToCheckout() {
    if (submitting) return
    setScreen({ name: 'checkout' })
  }

  function startNewOrder() {
    setParticipants([emptyParticipant()])
    setEmail('')
    setTouched(new Set())
    setFailure(null)
    setScreen({ name: 'checkout' })
    // Остаток за время заказа изменился, и новое число знает только сервер.
    void fetchSeats().then((seats) => {
      if (seats !== null) setSeatsLeft(seats)
    })
  }

  /** Кнопка «Применить» демонстрационной панели. */
  function applyDemoSeats(raw: string) {
    void applySeats(raw).then((applied) => {
      // null, значит принятого остатка нет: значение не прошло правила,
      // запрос упал, сервер его отбил или в ответе нет числа. Показанный
      // остаток тогда остаётся прежним.
      if (applied !== null) setSeatsLeft(applied)
    })
  }

  function activeScreen() {
    if (screen.name === 'review') {
      return (
        <ReviewScreen
          participants={participants}
          email={email}
          total={total}
          seatsLeft={seatsLeft}
          submitting={submitting}
          failure={failure}
          onEdit={backToCheckout}
          onConfirm={confirmOrder}
        />
      )
    }

    if (screen.name === 'soldOut') {
      return (
        <SoldOutScreen
          seatsLeft={screen.seatsLeft}
          submitting={submitting}
          onEditOrder={backToCheckout}
          onRetry={confirmOrder}
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
        seatsLeft={seatsLeft}
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

  return (
    <>
      {activeScreen()}

      {/* Панель живёт под активным экраном, а не внутри формы: она видна
          всегда, в том числе на проверке и на экранах результата. Ширина
          обёртки повторяет ширину активного экрана, иначе панель оказывается
          шире блока над ней. Нижний запас под прилипшую полосу формы стоит
          здесь, а не у формы: панель теперь последний блок страницы, и запас
          нужен один. */}
      <div
        className={`mx-auto w-full px-4 ${
          screen.name === 'checkout' ? 'max-w-5xl pb-64 lg:pb-12' : 'max-w-2xl pb-12'
        }`}
      >
        <DemoPanel onApply={applyDemoSeats} />
      </div>
    </>
  )
}
