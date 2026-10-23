type ButtonProps = {
  children: string
  onClick: () => void
  /** Нужен, когда на кнопку переносится фокус после изменения состава заказа. */
  id?: string
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  /**
   * Кнопка закрыта, но остаётся в обходе табом: так скринридер успевает
   * прочитать причину, связанную через `ariaDescribedBy`. Клик до обработчика
   * доходит: закрытая кнопка не делает своего дела, но показывает причины.
   */
  ariaDisabled?: boolean
  ariaDescribedBy?: string
  /** Доступное имя, когда видимой подписи мало: несколько одинаковых кнопок подряд. */
  ariaLabel?: string
  block?: boolean
}

const BASE =
  'min-h-11 rounded-xl px-4 text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed aria-disabled:cursor-not-allowed'

/**
 * Закрытый вид это отдельные цвета, а не прозрачность поверх открытых. Прежний
 * `opacity-50` давал на главной кнопке 2.4:1, а она при `ariaDisabled` остаётся
 * работающей: послабление для выключенных кнопок к ней не применимо, нужен
 * 4.5:1. Вид один на оба способа закрыть кнопку, чтобы на экране они не
 * выглядели разными состояниями.
 */
const VARIANTS = {
  primary: {
    open: 'bg-accent text-accent-contrast hover:bg-accent-hover',
    closed: 'bg-muted text-accent-contrast',
  },
  secondary: {
    open: 'border border-control-line bg-surface text-foreground hover:bg-background',
    closed: 'border border-line bg-surface text-muted',
  },
} as const

export function Button({
  children,
  onClick,
  id,
  variant = 'primary',
  disabled,
  ariaDisabled,
  ariaDescribedBy,
  ariaLabel,
  block = true,
}: ButtonProps) {
  const closed = disabled === true || ariaDisabled === true

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={ariaDisabled ? true : undefined}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
      className={`${BASE} ${VARIANTS[variant][closed ? 'closed' : 'open']} ${block ? 'w-full' : ''}`}
    >
      {children}
    </button>
  )
}
