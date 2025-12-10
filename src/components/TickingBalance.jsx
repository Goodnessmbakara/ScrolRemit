import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Card from './Card'
import '../index.css'

export default function TickingBalance({ 
  initialBalance = 0, 
  streamRate = 0, 
  isStreaming = false 
}) {
  const [currentBalance, setCurrentBalance] = useState(initialBalance)
  const animationRef = useRef(null)
  const lastUpdateRef = useRef(Date.now())

  // Memoize formatted balance to avoid recalculation
  const formattedBalance = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(currentBalance)
  }, [currentBalance])

  // Memoize rate display
  const rateDisplay = useMemo(() => {
    if (!isStreaming || streamRate === 0) return null
    return `$${streamRate.toFixed(6)}/sec`
  }, [isStreaming, streamRate])

  // Stable update function using useCallback
  const updateBalance = useCallback(() => {
    const now = Date.now()
    const deltaSeconds = (now - lastUpdateRef.current) / 1000
    lastUpdateRef.current = now

    setCurrentBalance(prev => prev + (streamRate * deltaSeconds))
    
    if (isStreaming) {
      animationRef.current = requestAnimationFrame(updateBalance)
    }
  }, [streamRate, isStreaming])

  useEffect(() => {
    setCurrentBalance(initialBalance)
  }, [initialBalance])

  useEffect(() => {
    if (isStreaming && streamRate > 0) {
      lastUpdateRef.current = Date.now()
      animationRef.current = requestAnimationFrame(updateBalance)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isStreaming, streamRate, updateBalance])

  const containerStyles = useMemo(() => ({
    textAlign: 'center',
    padding: 'var(--spacing-2xl) 0',
  }), [])

  const labelStyles = useMemo(() => ({
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-off-black)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 'var(--spacing-md)',
  }), [])

  const balanceStyles = useMemo(() => ({
    fontSize: 'var(--font-size-6xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-accent)',
    marginBottom: 'var(--spacing-sm)',
    fontVariantNumeric: 'tabular-nums',
  }), [])

  const statusContainerStyles = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-sm)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-off-black)',
  }), [])

  const pulseStyles = useMemo(() => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-accent)',
    animation: isStreaming ? 'pulse 2s ease-in-out infinite' : 'none',
  }), [isStreaming])

  return (
    <div style={containerStyles}>
      <p style={labelStyles}>Available Balance</p>
      <h2 style={balanceStyles}>{formattedBalance}</h2>
      {rateDisplay && (
        <div style={statusContainerStyles}>
          <div style={pulseStyles} />
          <span>Streaming at {rateDisplay}</span>
        </div>
      )}
      <style>{`
        @keyframes pulse {
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
