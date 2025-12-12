import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, children, title }) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 'var(--spacing-xl)',
    animation: 'fadeIn 0.2s ease-out',
  }

  const modalStyles = {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--border-radius-lg)',
    border: '3px solid var(--color-black)',
    boxShadow: '8px 8px 0 var(--color-black)',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    animation: 'slideUp 0.3s ease-out',
  }

  const headerStyles = {
    padding: 'var(--spacing-2xl)',
    borderBottom: '2px solid var(--color-black)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const titleStyles = {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-bold)',
    margin: 0,
  }

  const closeButtonStyles = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px',
    lineHeight: 1,
    color: 'var(--color-black)',
    transition: 'transform 0.2s',
  }

  const contentStyles = {
    padding: 'var(--spacing-2xl)',
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <div style={overlayStyles} onClick={onClose}>
        <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
          {title && (
            <div style={headerStyles}>
              <h2 style={titleStyles}>{title}</h2>
              <button
                onClick={onClose}
                style={closeButtonStyles}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)'
                }}
              >
                ×
              </button>
            </div>
          )}
          <div style={contentStyles}>
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
