import Card from '../components/Card'
import Button from '../components/Button'
import TickingBalance from '../components/TickingBalance'
import { useWallets } from '@privy-io/react-auth'
import { useStreamingBalance } from '../hooks/useBalance'
import { getPublicProvider, getSigner, withdrawFromStream } from '../lib/contracts'
import { useState, useEffect } from 'react'

export default function Dashboard() {
  const { wallets } = useWallets()
  const address = wallets[0]?.address || ''
  
  // Use public provider for reading data (sync & robust)
  const provider = getPublicProvider()
  
  const { balance, streams, totalRate, isStreaming, isLoading } = useStreamingBalance(provider, address, true)
  const [claiming, setClaiming] = useState(false)
  const [claimStatus, setClaimStatus] = useState('')
  const [totalSupporters, setTotalSupporters] = useState(0)

  useEffect(() => {
    // Unique senders
    if (streams.length > 0) {
      const senders = new Set(streams.map(s => s.sender))
      setTotalSupporters(senders.size)
    }
  }, [streams])

  // Calculate Lifetime Received (sum of withdrawn + claimable part of claimed streams?)
  // Actually, 'withdrawn' property on stream object tracks what has been claimed.
  const lifetimeReceived = streams.reduce((acc, stream) => acc + parseFloat(stream.withdrawn || 0), 0)

  const handleClaimAll = async () => {
    if (!wallets[0] || claiming) return
    
    try {
      setClaiming(true)
      setClaimStatus('Initializing claim...')
      const signer = await getSigner(wallets[0])
      
      let claimedCount = 0
      
      // Filter streams with potential balance (simplified check: active)
      // Ideally we check claimable balance, but here we'll try all active streams
      const activeStreams = streams.filter(s => s.active || (s.rate > 0)) // Fallback if active flag missing in hook
      
      for (const stream of activeStreams) {
        try {
          // Skip if obviously new (optimization)
          // Actually, just try to withdraw. Contract handles 0 balance gracefully (reverts NoTokens? No, verify)
          // Contract reverts 'NoTokensAvailable' if 0.
          // So we should ideally check balance first. 
          // For MVP, we'll try and catch error silently.
          
          setClaimStatus(`Claiming from stream #${stream.id || stream.streamId}...`)
          const result = await withdrawFromStream(signer, stream.id || stream.streamId)
          
          if (result.success) {
            claimedCount++
          }
        } catch (e) {
          console.warn('Failed to claim from stream', stream, e)
        }
      }
      
      if (claimedCount > 0) {
        setClaimStatus(`✅ Successfully claimed from ${claimedCount} streams!`)
        // Refresh page or balance will auto-update via hook polling
        setTimeout(() => setClaimStatus(''), 3000)
      } else {
        setClaimStatus('No funds available to claim')
        setTimeout(() => setClaimStatus(''), 3000)
      }
      
    } catch (e) {
      console.error('Claim error:', e)
      setClaimStatus('❌ Claim failed')
    } finally {
      setClaiming(false)
    }
  }

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

      <div style={gridStyles} className="dashboard-grid">
        <Card padding="xl">
          <TickingBalance 
            initialBalance={balance} 
            streamRate={totalRate}
            isStreaming={isStreaming}
          />
          <div style={{ marginTop: 'var(--spacing-2xl)', textAlign: 'center' }}>
            <Button 
              variant="primary" 
              fullWidth 
              onClick={handleClaimAll}
              disabled={claiming || parseFloat(balance) <= 0}
            >
              {claiming ? (claimStatus || 'Claiming...') : 'Claim Funds'}
            </Button>
            {claimStatus && !claiming && (
              <p style={{ marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)' }}>
                {claimStatus}
              </p>
            )}
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
                {streams.filter(s => s.active).length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-off-black)' }}>
                Total Supporters
              </p>
              <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)' }}>
                {totalSupporters}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-off-black)' }}>
                Lifetime Received
              </p>
              <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-accent)' }}>
                ${lifetimeReceived.toFixed(2)}
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

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
            gap: var(--spacing-xl) !important;
          }
        }
      `}</style>
    </div>
  )
}
