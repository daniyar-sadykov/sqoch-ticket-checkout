import { expect, test, type CheckoutPage } from './fixtures'
import { ERROR, SCREEN } from './texts'

/** Ошибки ввода: тексты из раздела 6 спеки экранов и момент их появления. */

const NAME_CASES = [
  { title: 'пустое имя', value: '', error: ERROR.nameRequired },
  { title: 'имя из одних пробелов', value: '   ', error: ERROR.nameRequired },
  { title: 'имя длиннее 60 символов', value: 'Ж'.repeat(61), error: ERROR.nameTooLong },
] as const

for (const { title, value, error } of NAME_CASES) {
  test(`${title} даёт «${error}»`, async ({ checkout }) => {
    await checkout.open()

    await checkout.nameField(1).fill(value)
    await checkout.nameField(1).blur()

    await expect(checkout.card(1).getByText(error)).toBeVisible()
    await expect(checkout.nameField(1)).toHaveAttribute('aria-invalid', 'true')
  })
}

const AGE_CASES = [
  { title: 'пустой возраст', value: '', error: ERROR.ageRequired },
  { title: 'нечисловой возраст', value: 'abc', error: ERROR.ageNotInteger },
  { title: 'отрицательный возраст', value: '-5', error: ERROR.ageNotInteger },
  { title: 'дробный возраст', value: '1.5', error: ERROR.ageNotInteger },
  { title: 'возраст с ведущим нулём', value: '07', error: ERROR.ageNotInteger },
  { title: 'возраст больше 120', value: '121', error: ERROR.ageOutOfRange },
] as const

for (const { title, value, error } of AGE_CASES) {
  test(`${title} даёт «${error}»`, async ({ checkout }) => {
    await checkout.open()

    await checkout.ageField(1).fill(value)
    await checkout.ageField(1).blur()

    await expect(checkout.card(1).getByText(error)).toBeVisible()
    await expect(checkout.ageField(1)).toHaveAttribute('aria-invalid', 'true')
  })
}

const EMAIL_CASES = [
  { title: 'пустой email', value: '', error: ERROR.emailRequired },
  { title: 'email без собаки', value: 'не-email', error: ERROR.emailInvalid },
  { title: 'email без домена', value: 'anna@', error: ERROR.emailInvalid },
  { title: 'email без точки в домене', value: 'anna@example', error: ERROR.emailInvalid },
  { title: 'email без имени', value: '@example.com', error: ERROR.emailInvalid },
] as const

for (const { title, value, error } of EMAIL_CASES) {
  test(`${title} даёт «${error}»`, async ({ checkout }) => {
    await checkout.open()

    await checkout.emailField.fill(value)
    await checkout.emailField.blur()

    await expect(checkout.page.getByText(error)).toBeVisible()
    await expect(checkout.emailField).toHaveAttribute('aria-invalid', 'true')
  })
}

test('ошибка поля молчит, пока по полю не уходил фокус', async ({ checkout }) => {
  await checkout.open()

  await checkout.nameField(1).click()

  await expect(checkout.card(1).getByText(ERROR.nameRequired)).toHaveCount(0)
  await expect(checkout.nameField(1)).not.toHaveAttribute('aria-invalid', 'true')

  await checkout.nameField(1).blur()

  await expect(checkout.card(1).getByText(ERROR.nameRequired)).toBeVisible()
})

test('клик по закрытой кнопке перехода открывает все причины разом', async ({ checkout }) => {
  await checkout.open()

  await expectNoVisibleErrors(checkout)

  await checkout.clickClosed(checkout.toReviewButton)

  // Заказ при этом не уходит: закрытая кнопка только показывает причины.
  await checkout.expectScreen(SCREEN.checkout)
  await expect(checkout.card(1).getByText(ERROR.nameRequired)).toBeVisible()
  await expect(checkout.card(1).getByText(ERROR.ageRequired)).toBeVisible()
  await expect(checkout.page.getByText(ERROR.emailRequired)).toBeVisible()
  await expect(checkout.orderErrors).toContainText(ERROR.guardianRequired)
})

/**
 * Находка 2 плана стори 7, дефект приложения, не исправлен. Тот же сдвиг
 * раскладки, что в находке 1, но на главной кнопке экрана.
 *
 * Покупатель щёлкнул в поле «Имя», ничего не набрал и нажал закрытую кнопку
 * перехода. Нажатие уводит фокус из поля, появляются «Укажите имя» и причины
 * уровня заказа, живая область над кнопкой вырастает, кнопка уезжает вниз на
 * 32 px, и отпускание мыши приходится уже не на неё. Решение стори 3 о том,
 * что клик по закрытой кнопке открывает все причины разом, в этом случае не
 * срабатывает: остальные причины так и не появляются.
 */
test('клик по закрытой кнопке открывает причины и при фокусе в пустом поле', async ({ checkout }) => {
  test.fail(true, 'дефект: сдвиг раскладки на показе причин съедает клик')

  await checkout.open()
  await checkout.nameField(1).click()

  await checkout.clickClosed(checkout.toReviewButton)

  // Таймаут укорочен по той же причине, что в находке 1: ждать нечего.
  await expect(checkout.page.getByText(ERROR.emailRequired)).toBeVisible({ timeout: 3_000 })
  await expect(checkout.card(1).getByText(ERROR.ageRequired)).toBeVisible({ timeout: 3_000 })
})

test('исправленная ошибка уходит с экрана', async ({ checkout }) => {
  await checkout.open()
  await checkout.fillParticipant(1, '', '')

  await expect(checkout.card(1).getByText(ERROR.nameRequired)).toBeVisible()
  await expect(checkout.card(1).getByText(ERROR.ageRequired)).toBeVisible()

  await checkout.nameField(1).fill('Анна')
  await checkout.ageField(1).fill('30')

  await expect(checkout.card(1).getByText(ERROR.nameRequired)).toHaveCount(0)
  await expect(checkout.card(1).getByText(ERROR.ageRequired)).toHaveCount(0)
  await expect(checkout.nameField(1)).not.toHaveAttribute('aria-invalid', 'true')
})

async function expectNoVisibleErrors(checkout: CheckoutPage) {
  await expect(checkout.card(1).getByText(ERROR.nameRequired)).toHaveCount(0)
  await expect(checkout.card(1).getByText(ERROR.ageRequired)).toHaveCount(0)
  await expect(checkout.page.getByText(ERROR.emailRequired)).toHaveCount(0)
  await expect(checkout.orderErrors).toHaveText('')
}
