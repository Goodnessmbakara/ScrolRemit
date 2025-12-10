import '../index.css'

export default function Input({ 
  type = 'text',
  placeholder,
  value,
  onChange,
  label,
  error,
  fullWidth = false,
  ...props 
}) {
  const inputStyles = {
    width: fullWidth ? '100%' : 'auto',
    padding: 'var(--spacing-md)',
    fontSize: 'var(--font-size-base)',
    fontFamily: 'var(--font-family)',
    border: `var(--border-width) solid ${error ? 'var(--color-accent)' : 'var(--color-black)'}`,
    borderRadius: 'var(--border-radius)',
    backgroundColor: 'var(--color-white)',
    color: 'var(--color-black)',
    outline: 'none',
    transition: 'border-color var(--transition-base)',
  }

  const labelStyles = {
    display: 'block',
    marginBottom: 'var(--spacing-sm)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-black)',
  }

  const errorStyles = {
    marginTop: 'var(--spacing-xs)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-accent)',
  }

  const handleFocus = (e) => {
    e.target.style.borderColor = 'var(--color-accent)'
  }

  const handleBlur = (e) => {
    if (!error) {
      e.target.style.borderColor = 'var(--color-black)'
    }
  }

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && <label style={labelStyles}>{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={inputStyles}
        {...props}
      />
      {error && <p style={errorStyles}>{error}</p>}
    </div>
  )
}
