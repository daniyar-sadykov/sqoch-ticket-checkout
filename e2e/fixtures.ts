import { expect, test as base, type APIRequestContext, type Locator, type Page } from '@playwright/test'

import { BUTTON, EVENT, FIELD, HEADING, SCREEN } from './texts'

/**
 * Свой `test` поверх Playwright и объект страницы к нему.
 *
 * Фикстура остатка мест обязательна: остаток живёт в памяти процесса сервера и
 * общий на весь прогон. Без сброса перед каждым тестом исход теста зависел бы
 * от того, сколько мест выгребли предыдущие, то есть от порядка.
 */

type Fixtures = {
  /** Остаток мест. Сбрасывается на стартовый перед каждым тестом. */
  seats: Seats
  /** Экран заказа: поля, кнопки и ожидание экрана по заголовку. */
  checkout: CheckoutPage
}

type Seats = {
  /** Задаёт остаток на сервере. Зовётся до `open()`: показанное число
   *  страница берёт из ответа на монтаже. */
  set: (count: number) => Promise<void>
  /** Остаток на сервере сейчас. */
  read: () => Promise<number>
}

/**
 * Экран оформления и экраны результата держат один и тот же текст дважды: в
 * боковой сводке для компьютера и в прилипшей полосе для телефона. Видна всегда
 * одна из них, вторая закрыта `display: none`, поэтому ожидания фильтруются по
 * видимости. Так один и тот же локатор работает и на 1280, и на 360 px.
 *
 * Поиску по роли фильтр не нужен: `getByRole` закрытые от доступности элементы
 * и так не берёт.
 */
const shown = (locator: Locator) => locator.filter({ visible: true })

/** Экранирование ожидаемого текста, когда из него собирается регулярное выражение. */
const escapeForRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

async function readServerSeats(request: APIRequestContext): Promise<number> {
  const response = await request.get('/api/availability')
  expect(response.ok()).toBe(true)
  const body: unknown = await response.json()
  expect(body).toMatchObject({ seatsLeft: expect.any(Number) })
  return (body as { seatsLeft: number }).seatsLeft
}

async function setServerSeats(request: APIRequestContext, count: number): Promise<void> {
  const response = await request.put('/api/availability', { data: { seatsLeft: count } })
  expect(response.ok()).toBe(true)
  expect(await readServerSeats(request)).toBe(count)
}

export class CheckoutPage {
  /** Прямой доступ нужен тестам: заголовки, тексты и роли вне состава заказа
   *  ищутся по странице, а не через обёртки на каждый случай. */
  constructor(readonly page: Page) {}

  /** Открыть страницу заново. Остаток к этому моменту уже выставлен. */
  async open() {
    await this.page.goto('/')
    await expect(this.heading(SCREEN.checkout)).toBeVisible()
  }

  // --- экраны ---

  /** Заголовок первого уровня активного экрана. Он же цель переноса фокуса. */
  heading(name: string): Locator {
    return this.page.getByRole('heading', { level: 1, name, exact: true })
  }

  async expectScreen(name: string) {
    await expect(this.heading(name)).toBeVisible()
  }

  /** Экран сменился, значит фокус обязан стоять на его заголовке. */
  async expectScreenFocused(name: string) {
    await this.expectScreen(name)
    await expect(this.heading(name)).toBeFocused()
  }

  // --- состав заказа ---

  /** Карточка участника: единственный пункт списка со своим заголовком. */
  card(index: number): Locator {
    return this.page
      .getByRole('listitem')
      .filter({ has: this.page.getByRole('heading', { name: HEADING.participantCard(index), exact: true }) })
  }

  nameField(index: number): Locator {
    return this.card(index).getByLabel(FIELD.name, { exact: true })
  }

  ageField(index: number): Locator {
    return this.card(index).getByLabel(FIELD.age, { exact: true })
  }

  /** Подпись типа билета на карточке. Её нет, пока возраст не введён или неверен. */
  ticketLabel(index: number): Locator {
    return this.card(index).getByText(/билет,/)
  }

  removeButton(index: number): Locator {
    return this.page.getByRole('button', { name: BUTTON.removeParticipant(index), exact: true })
  }

  get addButton(): Locator {
    return this.page.getByRole('button', { name: BUTTON.addParticipant, exact: true })
  }

  get emailField(): Locator {
    return this.page.getByLabel(FIELD.email, { exact: true })
  }

  /**
   * Заполнить карточку. Фокус после каждого поля уводится: ошибка поля ждёт
   * первого ухода фокуса, и без этого форма молчит о пустых полях.
   */
  async fillParticipant(index: number, name: string, age: string) {
    await this.nameField(index).fill(name)
    await this.nameField(index).blur()
    await this.ageField(index).fill(age)
    await this.ageField(index).blur()
  }

  async fillEmail(email: string) {
    await this.emailField.fill(email)
    await this.emailField.blur()
  }

  /** Заказ на одного совершеннолетнего с верным email: валидный минимум. */
  async fillValidOrder(name = 'Анна', age = '30', email = 'anna@example.com') {
    await this.fillParticipant(1, name, age)
    await this.fillEmail(email)
  }

  async addParticipant() {
    await this.addButton.click()
  }

  // --- переходы ---

  get toReviewButton(): Locator {
    return this.page.getByRole('button', { name: BUTTON.toReview, exact: true })
  }

  /**
   * Кнопка отправки ищется по двум своим подписям разом: нажатая, она
   * становится «Отправляем...». Локатор, который переживает смену подписи,
   * нужен тесту повторного нажатия: второй клик приходит, пока в пути первый
   * запрос, и искать кнопку заново уже не по чему.
   */
  private pendingAware(label: string): Locator {
    return this.page.getByRole('button', {
      name: new RegExp(`^(${escapeForRegExp(label)}|${escapeForRegExp(BUTTON.confirmPending)})$`),
    })
  }

  /** «Подтвердить заказ» на экране проверки. */
  get confirmButton(): Locator {
    return this.pendingAware(BUTTON.confirm)
  }

  /** «Попробовать снова» на экране отказа по местам. */
  get retryButton(): Locator {
    return this.pendingAware(BUTTON.retry)
  }

  button(name: string): Locator {
    return this.page.getByRole('button', { name, exact: true })
  }

  /**
   * Клик по кнопке, закрытой через `aria-disabled`. Playwright считает такую
   * кнопку выключенной и обычного клика до неё не доводит, а покупатель её
   * нажимает: нативного `disabled` на ней нет, и по решению владельца закрытая
   * кнопка перехода обязана на клик показать все скрытые причины. `force`
   * снимает проверку Playwright, а не проверку приложения: обработчик получает
   * тот же самый клик и сам решает, что с ним делать.
   *
   * Закрытость проверяется тут же: иначе тест молча начал бы жать открытую
   * кнопку, если `aria-disabled` однажды перестанет ставиться.
   */
  async clickClosed(locator: Locator) {
    await expect(locator).toHaveAttribute('aria-disabled', 'true')
    await locator.click({ force: true })
  }

  async goToReview() {
    await this.toReviewButton.click()
    await this.expectScreen(SCREEN.review)
  }

  // --- сводка и ошибки ---

  /**
   * Блок «Ваш заказ». У секции нет доступного имени, поэтому она ищется по
   * своему заголовку: имя сделало бы её ориентиром страницы, каким соседние
   * секции не стали.
   */
  get summary(): Locator {
    return shown(
      this.page.locator('section').filter({ has: this.page.getByRole('heading', { name: HEADING.order, exact: true }) }),
    )
  }

  /**
   * Строка итога блока «Ваш заказ». Отдельный локатор, а не поиск суммы по
   * блоку: итог совпадает с ценой билета, когда в заказе один участник, и поиск
   * по тексту находил тогда и строку участника, и итог.
   */
  get total(): Locator {
    return this.summary.locator('p').filter({ hasText: 'Итого' })
  }

  /**
   * Блок «Решения сверх задания». Доступного имени у секции нет, как и у
   * соседних, поэтому ищется по своему заголовку.
   */
  get decisions(): Locator {
    return shown(
      this.page
        .locator('section')
        .filter({ has: this.page.getByRole('heading', { name: HEADING.decisions, exact: true }) }),
    )
  }

  /** Живая область с причинами уровня заказа. */
  get orderErrors(): Locator {
    return this.page.getByRole('status')
  }

  get eventSeats(): Locator {
    return this.page.getByText(/^Осталось мест: \d+$/)
  }

  // --- демонстрационная панель ---

  get demoSeatsField(): Locator {
    return this.page.getByLabel(FIELD.demoSeats, { exact: true })
  }

  get applySeatsButton(): Locator {
    return this.page.getByRole('button', { name: BUTTON.applySeats, exact: true })
  }
}

export const test = base.extend<Fixtures>({
  /**
   * Фикстура `auto`, потому что сброс нужен и тесту, который об остатке не
   * спрашивает: успешный заказ соседа оставил бы ему меньше мест, чем он ждёт.
   * Сброс идёт до тела теста, а тест, которому нужно другое число, выставляет
   * его первой строкой.
   */
  seats: [
    async ({ request }, use) => {
      await setServerSeats(request, EVENT.startSeats)

      await use({
        set: (count) => setServerSeats(request, count),
        read: () => readServerSeats(request),
      })
    },
    { auto: true },
  ],

  checkout: async ({ page }, use) => {
    await use(new CheckoutPage(page))
  },
})

export { expect }
