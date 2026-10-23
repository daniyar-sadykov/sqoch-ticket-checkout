'use client'

import { useState } from 'react'

import { orderTotal, type Participant } from '@/domain/order'
import { submitOrder } from '@/lib/api'

import { CheckoutScreen } from '@/components/CheckoutScreen'
import { SuccessScreen } from '@/components/SuccessScreen'

/**
 * Сценарий оформления билетов.
 *
 * Стори 1 ведёт покупателя от экрана оформления сразу к результату. Экран
 * проверки заказа встаёт между ними в стори 4, исход «мест не осталось»
 * добавляется к результату в стори 5.
 */

type Screen = { name: 'checkout' } | { name: 'success'; orderNumber: string }

/**
 * Id первого участника задан константой, а не вычисляется: значение, разное на
 * сервере и на клиенте, ломает сверку разметки при гидратации. Уникальные id
 * для добавленных участников приходят со стори 3.
 */
const FIRST_PARTICIPANT_ID = 'participant-1'

function emptyParticipant(): Participant {
  return { id: FIRST_PARTICIPANT_ID, name: '', age: '' }
}

export default function CheckoutPage() {
  const [participants, setParticipants] = useState<Participant[]>(() => [emptyParticipant()])
  const [email, setEmail] = useState('')
  const [screen, setScreen] = useState<Screen>({ name: 'checkout' })
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const total = orderTotal(participants)

  function changeParticipant(id: string, patch: Partial<Pick<Participant, 'name' | 'age'>>) {
    setParticipants((current) =>
      current.map((participant) => (participant.id === id ? { ...participant, ...patch } : participant)),
    )
  }

  async function confirmOrder() {
    if (submitting) return

    setSubmitting(true)
    setFailure(null)

    const result = await submitOrder({ participants, email })

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
    setFailure(null)
    setScreen({ name: 'checkout' })
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
      submitting={submitting}
      failure={failure}
      onParticipantChange={changeParticipant}
      onEmailChange={setEmail}
      onSubmit={confirmOrder}
    />
  )
}
