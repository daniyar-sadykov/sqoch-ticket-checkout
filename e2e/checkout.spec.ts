import { expect, test } from './fixtures'
import { BUTTON, ERROR, EVENT, HEADING, ORDER_NUMBER_PATTERN, SCREEN, TEXT, TICKET } from './texts'

/** Состав экранов и сквозной путь заказа. */

test('экран оформления показывает мероприятие, участника и остаток мест', async ({ checkout }) => {
  await checkout.open()

  await expect(checkout.page.getByRole('heading', { level: 2, name: EVENT.title })).toBeVisible()
  await expect(checkout.page.getByText(EVENT.date)).toBeVisible()
  await expect(checkout.page.getByText(EVENT.place)).toBeVisible()
  await expect(checkout.eventSeats).toHaveText(TEXT.seatsLeft(EVENT.startSeats))

  await expect(checkout.page.getByRole('heading', { name: HEADING.participants, exact: true })).toBeVisible()
  await expect(checkout.card(1)).toBeVisible()
  await expect(checkout.card(2)).toHaveCount(0)
  await expect(checkout.page.getByRole('heading', { name: HEADING.contact, exact: true })).toBeVisible()
  await expect(checkout.summary).toBeVisible()
  await expect(checkout.decisions).toBeVisible()

  // Пустой заказ дальше не идёт, и кнопка перехода об этом говорит.
  await expect(checkout.toReviewButton).toHaveAttribute('aria-disabled', 'true')
})

test('сквозной путь: оформление, проверка, успех', async ({ checkout, seats }) => {
  await seats.set(5)
  await checkout.open()

  await checkout.fillValidOrder('Анна', '30', 'anna@example.com')

  await expect(checkout.summary.getByText(TEXT.summaryLine('Анна', '30 лет', TICKET.full))).toBeVisible()
  await expect(checkout.total).toContainText(TEXT.total('2 000'))
  await expect(checkout.toReviewButton).not.toHaveAttribute('aria-disabled', 'true')

  await checkout.goToReview()
  await checkout.confirmButton.click()

  await checkout.expectScreen(SCREEN.success)
  await expect(checkout.page.getByText(TEXT.orderNumber)).toContainText(ORDER_NUMBER_PATTERN)
  await expect(checkout.summary.getByText(TEXT.summaryLine('Анна', '30 лет', TICKET.full))).toBeVisible()
  await expect(checkout.total).toContainText(TEXT.total('2 000'))
  await expect(checkout.page.getByText(TEXT.ticketsSentTo('anna@example.com'))).toBeVisible()
  await expect(checkout.button(BUTTON.newOrder)).toBeVisible()

  // Один участник занимает одно место независимо от типа билета.
  expect(await seats.read()).toBe(4)
})

test('экран проверки показывает состав, итог, email и две кнопки', async ({ checkout }) => {
  await checkout.open()
  await checkout.fillValidOrder('Борис', '40', 'boris@example.com')
  await checkout.goToReview()

  await expect(checkout.page.getByRole('heading', { level: 2, name: EVENT.title })).toBeVisible()
  await expect(checkout.summary.getByText(TEXT.summaryLine('Борис', '40 лет', TICKET.full))).toBeVisible()
  await expect(checkout.total).toContainText(TEXT.total('2 000'))
  await expect(checkout.page.getByText(TEXT.reviewEmail('boris@example.com'))).toBeVisible()
  await expect(checkout.confirmButton).toBeVisible()
  await expect(checkout.button(BUTTON.edit)).toBeVisible()
})

test('«Изменить» возвращает на оформление со всеми данными', async ({ checkout }) => {
  await checkout.open()
  await checkout.fillValidOrder('Вера', '25', 'vera@example.com')
  await checkout.goToReview()

  await checkout.button(BUTTON.edit).click()

  await checkout.expectScreen(SCREEN.checkout)
  await expect(checkout.nameField(1)).toHaveValue('Вера')
  await expect(checkout.ageField(1)).toHaveValue('25')
  await expect(checkout.emailField).toHaveValue('vera@example.com')
})

test('«Новый заказ» очищает состояние и возвращает на оформление', async ({ checkout, seats }) => {
  await seats.set(3)
  await checkout.open()
  await checkout.fillValidOrder('Галина', '33', 'galina@example.com')
  await checkout.goToReview()
  await checkout.confirmButton.click()
  await checkout.expectScreen(SCREEN.success)

  await checkout.button(BUTTON.newOrder).click()

  await checkout.expectScreen(SCREEN.checkout)
  await expect(checkout.nameField(1)).toHaveValue('')
  await expect(checkout.ageField(1)).toHaveValue('')
  await expect(checkout.emailField).toHaveValue('')
  await expect(checkout.card(2)).toHaveCount(0)
  await expect(checkout.toReviewButton).toHaveAttribute('aria-disabled', 'true')
  // Остаток перечитан с сервера: место за прошлый заказ уже списано.
  await expect(checkout.eventSeats).toHaveText(TEXT.seatsLeft(2))
})

test('итог на двух полных и двух детских билетах это 6 000 ₽', async ({ checkout }) => {
  await checkout.open()

  await checkout.fillParticipant(1, 'Анна', '30')
  await checkout.addParticipant()
  await checkout.fillParticipant(2, 'Борис', '35')
  await checkout.addParticipant()
  await checkout.fillParticipant(3, 'Вера', '10')
  await checkout.addParticipant()
  await checkout.fillParticipant(4, 'Глеб', '7')
  await checkout.fillEmail('anna@example.com')

  await expect(checkout.summary.getByRole('listitem')).toHaveCount(4)
  await expect(checkout.summary.getByText(TEXT.summaryLine('Анна', '30 лет', TICKET.full))).toBeVisible()
  await expect(checkout.summary.getByText(TEXT.summaryLine('Борис', '35 лет', TICKET.full))).toBeVisible()
  await expect(checkout.summary.getByText(TEXT.summaryLine('Вера', '10 лет', TICKET.child))).toBeVisible()
  await expect(checkout.summary.getByText(TEXT.summaryLine('Глеб', '7 лет', TICKET.child))).toBeVisible()
  await expect(checkout.total).toContainText(TEXT.total('6 000'))
  await expect(checkout.orderErrors).toHaveText('')
})

test('демонстрационная панель задаёт остаток мест', async ({ checkout, seats }) => {
  await checkout.open()

  await expect(checkout.page.getByRole('heading', { name: HEADING.demo, exact: true })).toBeVisible()
  await expect(checkout.page.getByText(TEXT.demoHint)).toBeVisible()
  // Непригодное значение остатком не станет, и кнопка об этом говорит видом.
  await expect(checkout.applySeatsButton).toBeDisabled()

  await checkout.demoSeatsField.fill('3')
  await checkout.applySeatsButton.click()

  await expect(checkout.eventSeats).toHaveText(TEXT.seatsLeft(3))
  expect(await seats.read()).toBe(3)
})

test('блок решений сверх задания стоит на оформлении и только там', async ({ checkout, seats }) => {
  await seats.set(5)
  await checkout.open()

  // Заголовок второго уровня, как у соседних секций экрана, и две группы
  // третьим уровнем внутри него.
  await expect(checkout.page.getByRole('heading', { level: 2, name: HEADING.decisions, exact: true })).toBeVisible()
  await expect(checkout.decisions.getByText(TEXT.decisionsIntro)).toBeVisible()
  await expect(
    checkout.decisions.getByRole('heading', { level: 3, name: HEADING.decisionsStricter, exact: true }),
  ).toBeVisible()
  await expect(
    checkout.decisions.getByRole('heading', { level: 3, name: HEADING.decisionsSilent, exact: true }),
  ).toBeVisible()
  await expect(checkout.decisions.getByText(TEXT.decisionGuardian)).toBeVisible()
  await expect(checkout.decisions.getByText(TEXT.decisionSeatPerParticipant)).toBeVisible()

  // Блок ничем не управляет, поэтому в обходе с клавиатуры его нет: забрать
  // фокус у формы нечему.
  await expect(checkout.decisions.locator('a, button, input, select, textarea, [tabindex]')).toHaveCount(0)

  // Блок объясняет правила заполнения, поэтому дальше оформления не идёт.
  await checkout.fillValidOrder()
  await checkout.goToReview()
  await expect(checkout.decisions).toHaveCount(0)

  await checkout.confirmButton.click()
  await checkout.expectScreen(SCREEN.success)
  await expect(checkout.decisions).toHaveCount(0)
})

test('ошибки уровня заказа молчат, пока ни одно поле не тронуто', async ({ checkout }) => {
  await checkout.open()

  await expect(checkout.orderErrors).toHaveText('')
  await expect(checkout.page.getByText(ERROR.guardianRequired)).toHaveCount(0)
})
