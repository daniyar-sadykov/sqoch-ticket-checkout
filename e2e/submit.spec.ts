import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'
import { BUTTON, SCREEN, TEXT } from './texts'

/**
 * Повторная отправка. Единственное место во всём наборе, где тест вмешивается
 * в сеть, и вмешивается только задержкой: ответ идёт настоящий, от настоящего
 * маршрута, задерживается лишь его доставка. Без задержки моковый сервер
 * отвечает за единицы миллисекунд, и второе нажатие не успевает попасть в
 * окно, пока запрос в пути, то есть проверять было бы нечего.
 */

const RESPONSE_DELAY_MS = 1500

/** Задержать ответ маршрута заказа, не подменяя его. */
async function delayOrderResponse(page: Page) {
  await page.route('**/api/orders', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, RESPONSE_DELAY_MS))
    await route.continue()
  })
}

test('пока запрос в пути, кнопка подтверждения закрыта и показывает ожидание', async ({ checkout, seats }) => {
  await seats.set(4)
  await checkout.open()
  await delayOrderResponse(checkout.page)

  await checkout.fillValidOrder()
  await checkout.goToReview()
  await checkout.confirmButton.click()

  await expect(checkout.confirmButton).toHaveText(BUTTON.confirmPending)
  await expect(checkout.confirmButton).toHaveAttribute('aria-disabled', 'true')
  // Кнопка возврата закрыта тоже: иначе ответ догнал бы покупателя на форме.
  await expect(checkout.button(BUTTON.edit)).toHaveAttribute('aria-disabled', 'true')

  await checkout.expectScreen(SCREEN.success)
})

test('повторное нажатие подтверждения не создаёт второй заказ', async ({ checkout, seats }) => {
  await seats.set(4)

  let posts = 0
  checkout.page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/orders') posts += 1
  })

  await checkout.open()
  await delayOrderResponse(checkout.page)

  await checkout.fillValidOrder('Анна', '30', 'anna@example.com')
  await checkout.goToReview()

  // Второе нажатие приходит, пока первый запрос в пути и кнопка закрыта.
  await checkout.confirmButton.click()
  await expect(checkout.confirmButton).toHaveText(BUTTON.confirmPending)
  await checkout.clickClosed(checkout.confirmButton)

  await checkout.expectScreen(SCREEN.success)
  await expect(checkout.page.getByText(TEXT.ticketsSentTo('anna@example.com'))).toBeVisible()

  expect(posts).toBe(1)
  // Одно место за один заказ. Два заказа оставили бы 2.
  expect(await seats.read()).toBe(3)
})

test('повторное нажатие на экране отказа по местам не создаёт второй запрос', async ({ checkout, seats }) => {
  await seats.set(1)

  let posts = 0
  checkout.page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/orders') posts += 1
  })

  await checkout.open()
  await checkout.fillParticipant(1, 'Анна', '30')
  await checkout.addParticipant()
  await checkout.fillParticipant(2, 'Борис', '10')
  await checkout.fillEmail('anna@example.com')
  await checkout.goToReview()
  await checkout.confirmButton.click()
  await checkout.expectScreen(SCREEN.soldOut)
  expect(posts).toBe(1)

  await delayOrderResponse(checkout.page)

  await checkout.retryButton.click()
  await expect(checkout.retryButton).toHaveText(BUTTON.confirmPending)
  await checkout.clickClosed(checkout.retryButton)

  await expect(checkout.retryButton).toHaveText(BUTTON.retry)
  await checkout.expectScreen(SCREEN.soldOut)
  // Повтор ушёл один раз, всего за тест два запроса: первый и повтор.
  expect(posts).toBe(2)
  expect(await seats.read()).toBe(1)
})
