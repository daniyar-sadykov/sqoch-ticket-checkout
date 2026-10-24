import { expect, test } from './fixtures'
import { ERROR, SCREEN, TICKET } from './texts'

/**
 * Состав заказа и границы возраста.
 *
 * Два текста уровня заказа, «В заказе не больше 4 участников» и «В заказе
 * должен остаться хотя бы один участник», из интерфейса недостижимы: кнопки
 * состава закрываются раньше, чем состав выходит за границы. Здесь проверяется
 * именно это, что границы держат кнопки, а сами тексты закрыты модульными
 * тестами `src/domain/order.test.ts`.
 */

const EMAIL = 'test@example.com'

const TICKET_BY_AGE = [
  { age: '0', ticket: TICKET.child },
  { age: '13', ticket: TICKET.child },
  { age: '14', ticket: TICKET.full },
  { age: '17', ticket: TICKET.full },
  { age: '18', ticket: TICKET.full },
  { age: '120', ticket: TICKET.full },
] as const

for (const { age, ticket } of TICKET_BY_AGE) {
  test(`возраст ${age} даёт подпись «${ticket}»`, async ({ checkout }) => {
    await checkout.open()
    await checkout.fillParticipant(1, 'Тест', age)

    await expect(checkout.ticketLabel(1)).toHaveText(ticket)
  })
}

/** Сопровождающим считается только участник от 18 лет. */
const GUARDIAN_BY_AGE = [
  { age: '0', guardian: false },
  { age: '13', guardian: false },
  { age: '14', guardian: false },
  { age: '17', guardian: false },
  { age: '18', guardian: true },
  { age: '120', guardian: true },
] as const

for (const { age, guardian } of GUARDIAN_BY_AGE) {
  test(`возраст ${age} ${guardian ? 'закрывает' : 'не закрывает'} правило сопровождения`, async ({ checkout }) => {
    await checkout.open()
    await checkout.fillParticipant(1, 'Тест', age)
    await checkout.fillEmail(EMAIL)

    if (guardian) {
      await expect(checkout.orderErrors).not.toContainText(ERROR.guardianRequired)
      await expect(checkout.toReviewButton).not.toHaveAttribute('aria-disabled', 'true')
    } else {
      await expect(checkout.orderErrors).toContainText(ERROR.guardianRequired)
      await expect(checkout.toReviewButton).toHaveAttribute('aria-disabled', 'true')
    }
  })
}

test('возраст 121 не принимается и подписи билета не даёт', async ({ checkout }) => {
  await checkout.open()
  await checkout.fillParticipant(1, 'Тест', '121')
  await checkout.fillEmail(EMAIL)

  await expect(checkout.card(1).getByText(ERROR.ageOutOfRange)).toBeVisible()
  await expect(checkout.ticketLabel(1)).toHaveCount(0)
  await expect(checkout.toReviewButton).toHaveAttribute('aria-disabled', 'true')
})

test('заказ без участника от 18 лет не идёт дальше', async ({ checkout }) => {
  await checkout.open()
  await checkout.fillParticipant(1, 'Ребёнок', '10')
  await checkout.fillEmail(EMAIL)

  await expect(checkout.orderErrors).toContainText(ERROR.guardianRequired)

  await checkout.clickClosed(checkout.toReviewButton)

  await checkout.expectScreen(SCREEN.checkout)
})

test('ребёнок плюс семнадцатилетний не идёт дальше', async ({ checkout }) => {
  await checkout.open()
  await checkout.fillParticipant(1, 'Ребёнок', '10')
  await checkout.addParticipant()
  await checkout.fillParticipant(2, 'Подросток', '17')
  await checkout.fillEmail(EMAIL)

  await expect(checkout.orderErrors).toContainText(ERROR.guardianRequired)
  await expect(checkout.toReviewButton).toHaveAttribute('aria-disabled', 'true')
})

test('ребёнок плюс восемнадцатилетний идёт дальше', async ({ checkout }) => {
  await checkout.open()
  await checkout.fillParticipant(1, 'Ребёнок', '10')
  await checkout.addParticipant()
  await checkout.fillParticipant(2, 'Взрослый', '18')
  await checkout.fillEmail(EMAIL)

  await expect(checkout.orderErrors).toHaveText('')

  await checkout.goToReview()
})

test('заказ только из участников 14-17 лет не идёт дальше', async ({ checkout }) => {
  await checkout.open()
  await checkout.fillParticipant(1, 'Первый', '14')
  await checkout.addParticipant()
  await checkout.fillParticipant(2, 'Второй', '17')
  await checkout.fillEmail(EMAIL)

  // Оба билета полные, но сопровождающего в заказе нет.
  await expect(checkout.ticketLabel(1)).toHaveText(TICKET.full)
  await expect(checkout.ticketLabel(2)).toHaveText(TICKET.full)
  await expect(checkout.orderErrors).toContainText(ERROR.guardianRequired)
  await expect(checkout.toReviewButton).toHaveAttribute('aria-disabled', 'true')
})

test('удаление единственного совершеннолетнего снова делает заказ невалидным', async ({ checkout }) => {
  await checkout.open()
  await checkout.fillParticipant(1, 'Ребёнок', '10')
  await checkout.addParticipant()
  await checkout.fillParticipant(2, 'Взрослый', '18')
  await checkout.fillEmail(EMAIL)

  await expect(checkout.toReviewButton).not.toHaveAttribute('aria-disabled', 'true')

  await checkout.removeButton(2).click()

  await expect(checkout.card(2)).toHaveCount(0)
  await expect(checkout.orderErrors).toContainText(ERROR.guardianRequired)
  await expect(checkout.toReviewButton).toHaveAttribute('aria-disabled', 'true')
})

test('пятый участник не добавляется, кнопка остаётся видимой', async ({ checkout }) => {
  await checkout.open()

  // Карточка заполняется перед каждым добавлением, а не после всех: иначе клик
  // по кнопке добавления теряется на сдвиге раскладки, как в известном дефекте
  // ниже. Это и есть обычный порядок: сначала участник, потом следующий.
  await checkout.fillParticipant(1, 'Первый', '30')
  for (const index of [2, 3, 4]) {
    await checkout.addParticipant()
    await checkout.fillParticipant(index, `Участник ${index}`, '30')
  }

  await expect(checkout.card(4)).toBeVisible()
  await expect(checkout.card(5)).toHaveCount(0)
  // Недоступная кнопка остаётся на экране: иначе непонятно, куда делось действие.
  await expect(checkout.addButton).toBeVisible()
  await expect(checkout.addButton).toBeDisabled()
})

/**
 * Дефект приложения, найденный этим набором и не исправленный.
 *
 * Фокус стоит в пустом поле, покупатель жмёт «Добавить участника». Нажатие
 * уводит фокус из поля, у поля появляется «Укажите имя», карточка вырастает, и
 * кнопка уезжает вниз на 26 px между нажатием и отпусканием кнопки мыши.
 * Отпускание приходится уже не на кнопку, события `click` браузер не
 * порождает, обработчик не зовётся, участник не добавляется. Второе нажатие
 * проходит: ошибка уже на экране, и двигаться больше нечему.
 *
 * Тест помечен ожидаемо падающим, а не выброшен: иначе дефект снова станет
 * невидимым. Когда его исправят, `test.fail` начнёт сообщать об успехе как об
 * ошибке, и метку снимут вместе с исправлением.
 */
test('клик по добавлению не теряется при фокусе в пустом поле', async ({ checkout }) => {
  test.fail(true, 'дефект: сдвиг раскладки на показе ошибки съедает клик')

  await checkout.open()
  await checkout.nameField(1).click()

  await checkout.addButton.click()

  // Таймаут укорочен: пока дефект на месте, ждать тут нечего, а общие 10
  // секунд удлиняли бы каждый прогон набора.
  await expect(checkout.card(2)).toBeVisible({ timeout: 3_000 })
})

test('единственный участник не удаляется, кнопка остаётся видимой', async ({ checkout }) => {
  await checkout.open()

  await expect(checkout.card(1)).toBeVisible()
  await expect(checkout.removeButton(1)).toBeVisible()
  await expect(checkout.removeButton(1)).toBeDisabled()
})

test('кнопка удаления открывается со вторым участником и закрывается с его уходом', async ({ checkout }) => {
  await checkout.open()
  await checkout.addParticipant()

  await expect(checkout.removeButton(1)).toBeEnabled()
  await expect(checkout.removeButton(2)).toBeEnabled()

  await checkout.removeButton(2).click()

  await expect(checkout.removeButton(1)).toBeDisabled()
})
