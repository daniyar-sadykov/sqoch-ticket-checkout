import { expect, test, type CheckoutPage } from './fixtures'
import { BUTTON, ORDER_NUMBER_PATTERN, SCREEN, TEXT } from './texts'

/**
 * Исход «мест не осталось». Сеть не подменяется: остаток задаётся через
 * `PUT /api/availability`, ровно как это делает демонстрационная панель, и
 * нехватку определяет сервер в момент подтверждения, как предписывает раздел 5
 * плана решения.
 */

const EMAIL = 'anna@example.com'

/** Заказ на троих с одним совершеннолетним: три места, валиден. */
async function fillOrderForThree(checkout: CheckoutPage) {
  await checkout.fillParticipant(1, 'Анна', '30')
  await checkout.addParticipant()
  await checkout.fillParticipant(2, 'Борис', '10')
  await checkout.addParticipant()
  await checkout.fillParticipant(3, 'Вера', '8')
  await checkout.fillEmail(EMAIL)
}

test('мест меньше, чем участников: заказ не создан и места не списаны', async ({ checkout, seats }) => {
  await seats.set(1)
  await checkout.open()
  await fillOrderForThree(checkout)
  await checkout.goToReview()

  await checkout.confirmButton.click()

  await checkout.expectScreen(SCREEN.soldOut)
  await expect(checkout.page.getByText(TEXT.soldOutReason)).toBeVisible()
  await expect(checkout.page.getByText(TEXT.soldOutSeats(1))).toBeVisible()
  await expect(checkout.button(BUTTON.editOrder)).toBeVisible()
  await expect(checkout.button(BUTTON.retry)).toBeVisible()
  // Номер заказа не выдан: на отказе заказа не возникает.
  await expect(checkout.page.getByText(ORDER_NUMBER_PATTERN)).toHaveCount(0)
  expect(await seats.read()).toBe(1)
})

test('повтор после того, как места появились, оформляет заказ', async ({ checkout, seats }) => {
  await seats.set(1)
  await checkout.open()
  await fillOrderForThree(checkout)
  await checkout.goToReview()
  await checkout.confirmButton.click()
  await checkout.expectScreen(SCREEN.soldOut)

  await seats.set(3)
  await checkout.button(BUTTON.retry).click()

  await checkout.expectScreen(SCREEN.success)
  await expect(checkout.page.getByText(TEXT.orderNumber)).toContainText(ORDER_NUMBER_PATTERN)
  expect(await seats.read()).toBe(0)
})

test('повтор при той же нехватке оставляет экран отказа', async ({ checkout, seats }) => {
  await seats.set(2)
  await checkout.open()
  await fillOrderForThree(checkout)
  await checkout.goToReview()
  await checkout.confirmButton.click()
  await checkout.expectScreen(SCREEN.soldOut)

  await checkout.button(BUTTON.retry).click()

  await checkout.expectScreen(SCREEN.soldOut)
  await expect(checkout.page.getByText(TEXT.soldOutSeats(2))).toBeVisible()
  expect(await seats.read()).toBe(2)
})

test('повтор показывает новое число, когда мест стало меньше', async ({ checkout, seats }) => {
  await seats.set(2)
  await checkout.open()
  await fillOrderForThree(checkout)
  await checkout.goToReview()
  await checkout.confirmButton.click()
  await checkout.expectScreen(SCREEN.soldOut)
  await expect(checkout.page.getByText(TEXT.soldOutSeats(2))).toBeVisible()

  await seats.set(1)
  await checkout.button(BUTTON.retry).click()

  await checkout.expectScreen(SCREEN.soldOut)
  await expect(checkout.page.getByText(TEXT.soldOutSeats(1))).toBeVisible()
})

test('«Изменить состав» возвращает на оформление со всеми данными', async ({ checkout, seats }) => {
  await seats.set(1)
  await checkout.open()
  await fillOrderForThree(checkout)
  await checkout.goToReview()
  await checkout.confirmButton.click()
  await checkout.expectScreen(SCREEN.soldOut)

  await checkout.button(BUTTON.editOrder).click()

  await checkout.expectScreen(SCREEN.checkout)
  await expect(checkout.nameField(1)).toHaveValue('Анна')
  await expect(checkout.nameField(2)).toHaveValue('Борис')
  await expect(checkout.nameField(3)).toHaveValue('Вера')
  await expect(checkout.emailField).toHaveValue(EMAIL)
})

test('остаток мест на экране это число с сервера', async ({ checkout, seats }) => {
  await seats.set(7)
  await checkout.open()

  await expect(checkout.eventSeats).toHaveText(TEXT.seatsLeft(7))

  await checkout.fillValidOrder()
  await checkout.goToReview()

  // Шапка на экране проверки показывает тот же остаток.
  await expect(checkout.eventSeats).toHaveText(TEXT.seatsLeft(7))
})
