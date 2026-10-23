type ButtonProps = {
  children: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  block?: boolean
}

const BASE =
  'min-h-11 rounded-xl px-4 text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const VARIANTS = {
  primary: 'bg-accent text-accent-contrast hover:bg-accent-hover',
  secondary: 'border border-line bg-surface text-foreground hover:bg-background',
} as const

export function Button({ children, onClick, variant = 'primary', disabled, block = true }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${BASE} ${VARIANTS[variant]} ${block ? 'w-full' : ''}`}
    >
      {children}
    </button>
  )
}
