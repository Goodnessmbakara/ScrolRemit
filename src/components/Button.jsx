import '../index.css'

export default function Button({ 
  children, 
  variant = 'primary', 
  onClick, 
  disabled = false,
  type = 'button',
  fullWidth = false 
}) {
  const baseStyles = {
    padding: 'var(--spacing-md) var(--spacing-xl)',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-medium)',
    border: 'var(--border-width-thick) solid',
    borderRadius: 'var(--border-radius)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all var(--transition-base)',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'var(--font-family)',
    opacity: disabled ? 0.5 : 1,
  }

  const variants = {
    primary: {
      backgroundColor: 'var(--color-accent)',
      color: 'var(--color-white)',
      borderColor: 'var(--color-accent)',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--color-black)',
      borderColor: 'var(--color-black)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-accent)',
      borderColor: 'var(--color-accent)',
    }
  }

  const handleMouseOver = (e) => {
    if (disabled) return
    if (variant === 'primary') {
      e.target.style.opacity = '0.85'
    } else {
      e.target.style.backgroundColor = variant === 'secondary' 
        ? 'var(--color-black)' 
        : 'var(--color-accent)'
      e.target.style.color = 'var(--color-white)'
    }
  }

  const handleMouseOut = (e) => {
    if (disabled) return
    if (variant === 'primary') {
      e.target.style.opacity = '1'
    } else {
      e.target.style.backgroundColor = 'transparent'
      e.target.style.color = variant === 'secondary' 
        ? 'var(--color-black)' 
        : 'var(--color-accent)'
    }
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      style={{ ...baseStyles, ...variants[variant] }}
    >
      {children}
    </button>
  )
}
