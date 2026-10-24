import { expect, test } from './fixtures'
import { BUTTON, SCREEN } from './texts'

/**
 * Перенос фокуса: при смене экрана фокус переходит на
 * заголовок нового. Без этого нажатая кнопка размонтируется, фокус падает на
 * `body`, обход с клавиатуры начинается заново с начала документа, а
 * сменившийся экран скринридеру не объявляет никто.
 */

test('на первом рендере фокус не трогается', async ({ checkout }) => {
  await checkout.open()

  await expect(checkout.heading(SCREEN.checkout)).not.toBeFocused()
  expect(await checkout.page.evaluate(() => document.activeElement?.tagName)).toBe('BODY')
})

test('переход на проверку уводит фокус на её заголовок', async ({ checkout }) => {
  await checkout.open()
  await checkout.fillValidOrder()

  await checkout.toReviewButton.click()

  await checkout.expectScreenFocused(SCREEN.review)
})

test('возврат к правке уводит фокус на заголовок оформления', async ({ checkout }) => {
  await checkout.open()
  await checkout.fillValidOrder()
  await checkout.goToReview()

  await checkout.button(BUTTON.edit).click()

  await checkout.expectScreenFocused(SCREEN.checkout)
})

test('успех уводит фокус на свой заголовок', async ({ checkout, seats }) => {
  await seats.set(2)
  await checkout.open()
  await checkout.fillValidOrder()
  await checkout.goToReview()

  await checkout.confirmButton.click()

  await checkout.expectScreenFocused(SCREEN.success)
})

test('отказ по местам уводит фокус на свой заголовок', async ({ checkout, seats }) => {
  await seats.set(0)
  await checkout.open()
  await checkout.fillValidOrder()
  await checkout.goToReview()

  await checkout.confirmButton.click()

  await checkout.expectScreenFocused(SCREEN.soldOut)
})

test('неудавшийся повтор снова уводит фокус на заголовок отказа', async ({ checkout, seats }) => {
  await seats.set(0)
  await checkout.open()
  await checkout.fillValidOrder()
  await checkout.goToReview()
  await checkout.confirmButton.click()
  await checkout.expectScreenFocused(SCREEN.soldOut)

  // Имя экрана не меняется, значит эффект смены экрана молчит: про неудавшийся
  // повтор сообщает отдельный перенос фокуса.
  await checkout.button(BUTTON.retry).click()

  await checkout.expectScreenFocused(SCREEN.soldOut)
})

test('новый заказ уводит фокус на заголовок оформления', async ({ checkout, seats }) => {
  await seats.set(2)
  await checkout.open()
  await checkout.fillValidOrder()
  await checkout.goToReview()
  await checkout.confirmButton.click()
  await checkout.expectScreen(SCREEN.success)

  await checkout.button(BUTTON.newOrder).click()

  await checkout.expectScreenFocused(SCREEN.checkout)
})

test('добавление участника уводит фокус на поле имени новой карточки', async ({ checkout }) => {
  await checkout.open()

  await checkout.addParticipant()

  await expect(checkout.nameField(2)).toBeFocused()
})

test('удаление участника уводит фокус на кнопку добавления', async ({ checkout }) => {
  await checkout.open()
  await checkout.addParticipant()

  await checkout.removeButton(2).click()

  await expect(checkout.addButton).toBeFocused()
})
