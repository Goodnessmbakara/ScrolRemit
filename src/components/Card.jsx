import '../index.css'

export default function Card({ children, padding = 'lg', border = true }) {
  const paddingMap = {
    sm: 'var(--spacing-md)',
    md: 'var(--spacing-lg)',
    lg: 'var(--spacing-xl)',
    xl: 'var(--spacing-2xl)',
  }

  const cardStyles = {
    backgroundColor: 'var(--color-white)',
    border: border ? 'var(--border-width) solid var(--color-black)' : 'none',
    borderRadius: 'var(--border-radius)',
    padding: paddingMap[padding],
  }

  return (
    <div style={cardStyles}>
      {children}
    </div>
  )
}
