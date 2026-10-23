import type { Locator, Page } from '@playwright/test'

import { expect, test, type CheckoutPage } from './fixtures'
import { BUTTON, ORDER_NUMBER_PATTERN, SCREEN, TEXT } from './texts'

/**
 * Ширина 360 px. Файл идёт только в проекте `mobile`: раскладка до 1024 px это
 * одна колонка и прилипшая полоса снизу, и проверять её на 1280 нечем.
 *
 * Горизонтальная прокрутка меряется, а не осматривается: длинное имя одним
 * словом и длинный email без пробелов это ровно те входные данные, на которых
 * раскладка расползалась, и видно это только по числам.
 */

/** Имя в границе 60 символов одним словом: заказ с ним валиден. */
const LONG_NAME = 'Ж'.repeat(60)
/** Имя за границей: заказ невалиден, но карточка рисуется и ширину задаёт. */
const TOO_LONG_NAME = 'Ж'.repeat(76)
/** 70 символов без пробелов, формат верный. */
const LONG_EMAIL = `${'o'.repeat(58)}@example.com`

const MIN_TARGET_SIZE = 44

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))

  expect(scrollWidth, `горизонтальная прокрутка: ${scrollWidth} px при окне ${clientWidth} px`).toBe(clientWidth)
}

async function expectTargetSize(name: string, locator: Locator) {
  const box = await locator.boundingBox()
  expect(box, `${name}: элемента нет на экране`).not.toBeNull()
  expect(box?.height, `${name}: высота ${String(box?.height)} px`).toBeGreaterThanOrEqual(MIN_TARGET_SIZE)
}

/** Валидный заказ на двоих с длинным именем и длинным email. */
async function fillValidPair(checkout: CheckoutPage) {
  await checkout.fillParticipant(1, LONG_NAME, '30')
  await checkout.addParticipant()
  await checkout.fillParticipant(2, 'Борис', '10')
  await checkout.fillEmail(LONG_EMAIL)
}

test('экран оформления не даёт горизонтальной прокрутки на четырёх длинных именах', async ({ checkout }) => {
  await checkout.open()

  await checkout.fillParticipant(1, TOO_LONG_NAME, '30')
  for (const index of [2, 3, 4]) {
    await checkout.addParticipant()
    await checkout.fillParticipant(index, TOO_LONG_NAME, '30')
  }
  await checkout.fillEmail(LONG_EMAIL)

  await expectNoHorizontalScroll(checkout.page)

  // Прокрутка до низа: ошибки уровня заказа тоже лежат в полосе и её растят.
  await checkout.page.mouse.wheel(0, 5000)
  await expectNoHorizontalScroll(checkout.page)
})

test('внизу прилипшая полоса с итогом и главной кнопкой экрана', async ({ checkout }) => {
  await checkout.open()
  await checkout.fillValidOrder()

  // На этой ширине боковая сводка закрыта, поэтому кнопка перехода одна, и это
  // кнопка полосы.
  const barButton = checkout.page.getByRole('button', { name: BUTTON.toReview, exact: true })
  await expect(barButton).toHaveCount(1)

  /* Полоса это прямой потомок `main`: она висит поверх содержимого, но лежит
     внутри ориентира страницы, иначе главная кнопка экрана оказалась бы вне
     его. Отсюда и поиск по структуре: доступного имени у полосы нет. */
  const bar = checkout.page.locator('main > div').filter({ has: barButton })
  await expect(bar).toContainText('Итого')
  await expect(bar).toContainText(TEXT.total('2 000'))

  // Прилипшая: при прокрутке страницы с места не двигается и стоит у низа окна.
  const viewport = checkout.page.viewportSize()
  const before = await barButton.boundingBox()
  await checkout.page.mouse.wheel(0, 3000)
  const after = await barButton.boundingBox()

  expect(after?.y).toBe(before?.y)
  expect((after?.y ?? 0) + (after?.height ?? 0)).toBeLessThanOrEqual(viewport?.height ?? 0)
})

test('поля и кнопки не ниже 44 px', async ({ checkout }) => {
  await checkout.open()
  await checkout.addParticipant()

  await expectTargetSize('поле «Имя»', checkout.nameField(1))
  await expectTargetSize('поле «Возраст»', checkout.ageField(1))
  await expectTargetSize('поле email', checkout.emailField)
  await expectTargetSize('кнопка добавления', checkout.addButton)
  await expectTargetSize('кнопка удаления', checkout.removeButton(1))
  await expectTargetSize('кнопка перехода', checkout.toReviewButton)
  await expectTargetSize('поле демонстрационной панели', checkout.demoSeatsField)
})

test('экран проверки не даёт горизонтальной прокрутки на длинном email', async ({ checkout }) => {
  await checkout.open()
  await fillValidPair(checkout)
  await checkout.goToReview()

  await expect(checkout.page.getByText(TEXT.reviewEmail(LONG_EMAIL))).toBeVisible()
  await expectNoHorizontalScroll(checkout.page)
})

test('сквозной путь проходится целиком на 360 px', async ({ checkout, seats }) => {
  await seats.set(4)
  await checkout.open()
  await fillValidPair(checkout)
  await checkout.goToReview()

  await checkout.confirmButton.click()

  await checkout.expectScreen(SCREEN.success)
  await expect(checkout.page.getByText(TEXT.orderNumber)).toContainText(ORDER_NUMBER_PATTERN)
  await expect(checkout.page.getByText(TEXT.ticketsSentTo(LONG_EMAIL))).toBeVisible()
  await expectNoHorizontalScroll(checkout.page)
  expect(await seats.read()).toBe(2)
})

test('экран «мест не осталось» не даёт горизонтальной прокрутки', async ({ checkout, seats }) => {
  await seats.set(1)
  await checkout.open()
  await fillValidPair(checkout)
  await checkout.goToReview()

  await checkout.confirmButton.click()

  await checkout.expectScreen(SCREEN.soldOut)
  await expectNoHorizontalScroll(checkout.page)
})
