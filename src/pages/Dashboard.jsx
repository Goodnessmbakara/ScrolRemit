import Card from '../components/Card'
import Button from '../components/Button'
import TickingBalance from '../components/TickingBalance'
import { useWallet } from '../context/WalletContext'
import { useStreamingBalance } from '../hooks/useBalance'

export default function Dashboard() {
  const { provider, address } = useWallet()
  const { balance, streams, totalRate, isStreaming } = useStreamingBalance(provider, address, false)
  const containerStyles = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: 'var(--spacing-3xl) var(--spacing-lg)',
  }

  const headerStyles = {
    fontSize: 'var(--font-size-4xl)',
    fontWeight: 'var(--font-weight-semibold)',
    marginBottom: 'var(--spacing-2xl)',
  }

  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 'var(--spacing-2xl)',
    marginBottom: 'var(--spacing-3xl)',
  }

  const sectionTitleStyles = {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-semibold)',
    marginBottom: 'var(--spacing-lg)',
  }

  const streamItemStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--spacing-md) 0',
    borderBottom: 'var(--border-width) solid var(--color-black)',
  }

  return (
    <div style={containerStyles}>
      <h1 style={headerStyles}>Creator Dashboard</h1>

      <div style={gridStyles}>
        <Card padding="xl">
          <TickingBalance 
            initialBalance={balance} 
            streamRate={totalRate}
            isStreaming={isStreaming}
          />
          <div style={{ marginTop: 'var(--spacing-2xl)', textAlign: 'center' }}>
            <Button variant="primary" fullWidth>
              Claim Funds
            </Button>
          </div>
        </Card>

        <Card padding="lg">
          <h3 style={sectionTitleStyles}>Quick Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-off-black)' }}>
                Active Streams
              </p>
              <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)' }}>
                {streams.length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-off-black)' }}>
                Total Supporters
              </p>
              <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)' }}>
                24
              </p>
            </div>
            <div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-off-black)' }}>
                Lifetime Received
              </p>
              <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-accent)' }}>
                $2,450.00
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <h3 style={sectionTitleStyles}>Active Incoming Streams</h3>
        {streams.length > 0 ? (
          <div>
            {streams.map((stream, index) => (
              <div key={index} style={streamItemStyles}>
                <div>
                  <p style={{ fontWeight: 'var(--font-weight-medium)' }}>
                    From {stream.sender || stream.from}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-off-black)' }}>
                    Started {new Date((stream.startTime || Date.now()) * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-accent)' }}>
                    ${stream.rate.toFixed(4)}/sec
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-off-black)', textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
            No active streams. Share your profile to start receiving support!
          </p>
        )}
      </Card>
    </div>
  )
}
