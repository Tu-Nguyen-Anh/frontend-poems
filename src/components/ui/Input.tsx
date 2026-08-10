import { useId, type InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...rest }: InputProps) {
  const id = useId()

  return (
    <div className="form-field">
      {label && (
        <label className="form-field__label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={`input ${error ? 'input--error' : ''} ${className}`.trim()}
        {...rest}
      />
      {error && <span className="form-field__error">{error}</span>}
    </div>
  )
}
