type ButtonProps = {
  children: string
  onClick: () => void
  /** Нужен, когда на кнопку переносится фокус после изменения состава заказа. */
  id?: string
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  /**
   * Кнопка закрыта, но остаётся в обходе табом: так скринридер успевает
   * прочитать причину, связанную через `ariaDescribedBy`. Клик ничего не делает.
   */
  ariaDisabled?: boolean
  ariaDescribedBy?: string
  block?: boolean
}

const BASE =
  'min-h-11 rounded-xl px-4 text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50'

const VARIANTS = {
  primary: 'bg-accent text-accent-contrast hover:bg-accent-hover',
  secondary: 'border border-line bg-surface text-foreground hover:bg-background',
} as const

export function Button({
  children,
  onClick,
  id,
  variant = 'primary',
  disabled,
  ariaDisabled,
  ariaDescribedBy,
  block = true,
}: ButtonProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={ariaDisabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={ariaDisabled ? true : undefined}
      aria-describedby={ariaDescribedBy}
      className={`${BASE} ${VARIANTS[variant]} ${block ? 'w-full' : ''}`}
    >
      {children}
    </button>
  )
}
