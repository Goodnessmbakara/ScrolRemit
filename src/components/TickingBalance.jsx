import { useState, useEffect } from 'react'
import '../index.css'

export default function TickingBalance({ 
  initialBalance = 0, 
  streamRate = 0.01, // USDC per second
  isStreaming = false,
  decimals = 2
}) {
  const [balance, setBalance] = useState(initialBalance)
  const [displayBalance, setDisplayBalance] = useState(initialBalance.toFixed(decimals))

  useEffect(() => {
    if (!isStreaming) {
      setDisplayBalance(balance.toFixed(decimals))
      return
    }

    const interval = setInterval(() => {
      setBalance(prev => {
        const newBalance = prev + streamRate
        setDisplayBalance(newBalance.toFixed(decimals))
        return newBalance
      })
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [isStreaming, streamRate, decimals, balance])

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
  }

  const balanceStyles = {
    fontSize: 'var(--font-size-6xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-accent)',
    fontFamily: 'var(--font-family)',
    letterSpacing: '-0.02em',
    transition: 'transform var(--transition-fast)',
  }

  const labelStyles = {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-off-black)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const statusStyles = {
    fontSize: 'var(--font-size-xs)',
    color: isStreaming ? 'var(--color-accent)' : 'var(--color-off-black)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
  }

  return (
    <div style={containerStyles}>
      <p style={labelStyles}>Available Balance</p>
      <div style={balanceStyles}>
        ${displayBalance}
      </div>
      <div style={statusStyles}>
        {isStreaming && (
          <>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-accent)',
              animation: 'pulse 2s infinite',
            }} />
            <span>Streaming at ${streamRate.toFixed(4)}/sec</span>
          </>
        )}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
