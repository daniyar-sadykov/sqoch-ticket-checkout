type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  hint?: string
  type?: 'text' | 'email'
  inputMode?: 'text' | 'numeric' | 'email'
  maxLength?: number
  autoComplete?: string
}

/**
 * Поле ввода с подписью и местом под ошибку. Ошибка связана с полем через
 * aria-describedby. Когда её показывать, решает форма: `onBlur` сообщает ей,
 * что по полю уже уходил фокус.
 */
export function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  type = 'text',
  inputMode,
  maxLength,
  autoComplete,
}: TextFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`mt-1.5 block min-h-11 w-full rounded-xl border bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          error ? 'border-danger' : 'border-line'
        }`}
      />
      {hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
