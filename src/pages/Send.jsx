import { useState } from 'react'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Send() {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [sendType, setSendType] = useState('instant') // 'instant' or 'stream'
  const [duration, setDuration] = useState('30') // days for streaming

  const containerStyles = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: 'var(--spacing-3xl) var(--spacing-lg)',
  }

  const headerStyles = {
    fontSize: 'var(--font-size-4xl)',
    fontWeight: 'var(--font-weight-semibold)',
    marginBottom: 'var(--spacing-md)',
  }

  const subheadStyles = {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-off-black)',
    marginBottom: 'var(--spacing-2xl)',
  }

  const toggleContainerStyles = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--spacing-sm)',
    marginBottom: 'var(--spacing-xl)',
  }

  const toggleButtonStyles = (isActive) => ({
    padding: 'var(--spacing-md)',
    border: `var(--border-width-thick) solid ${isActive ? 'var(--color-accent)' : 'var(--color-black)'}`,
    backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
    color: isActive ? 'var(--color-white)' : 'var(--color-black)',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-medium)',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    fontFamily: 'var(--font-family)',
  })

  const summaryStyles = {
    backgroundColor: 'var(--color-black)',
    color: 'var(--color-white)',
    padding: 'var(--spacing-lg)',
    marginTop: 'var(--spacing-xl)',
  }

  const calculateStreamRate = () => {
    if (!amount || !duration || sendType !== 'stream') return 0
    const totalSeconds = parseFloat(duration) * 24 * 60 * 60
    return (parseFloat(amount) / totalSeconds).toFixed(8)
  }

  const handleSend = () => {
    console.log('Sending:', { recipient, amount, sendType, duration })
    // TODO: Implement blockchain transaction
  }

  return (
    <div style={containerStyles}>
      <h1 style={headerStyles}>Send Payment</h1>
      <p style={subheadStyles}>
        Send instant payments or create streaming income for family and creators.
      </p>

      <Card padding="xl">
        <div style={toggleContainerStyles}>
          <button
            style={toggleButtonStyles(sendType === 'instant')}
            onClick={() => setSendType('instant')}
          >
            Instant Send
          </button>
          <button
            style={toggleButtonStyles(sendType === 'stream')}
            onClick={() => setSendType('stream')}
          >
            Stream Payment
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <Input
            label="Recipient Address or Username"
            placeholder="0x... or @username"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            fullWidth
          />

          <Input
            label="Amount (USDC)"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
          />

          {sendType === 'stream' && (
            <Input
              label="Stream Duration (Days)"
              type="number"
              placeholder="30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              fullWidth
            />
          )}

          {sendType === 'stream' && amount && duration && (
            <div style={summaryStyles}>
              <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-xs)' }}>
                Streaming Rate
              </p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                ${calculateStreamRate()} USDC/second
              </p>
              <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)', opacity: 0.8 }}>
                Recipient will see their balance increase in real-time
              </p>
            </div>
          )}

          <Button 
            variant="primary" 
            fullWidth
            onClick={handleSend}
            disabled={!recipient || !amount}
          >
            {sendType === 'instant' ? 'Send Payment' : 'Start Stream'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
