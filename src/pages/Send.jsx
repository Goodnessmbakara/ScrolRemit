import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useLocation } from 'react-router-dom'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import Modal from '../components/Modal'
import UsernameAutocomplete from '../components/UsernameAutocomplete'
import { 
  validateRecipient, 
  getSigner, 
  createStream, 
  getUSDCContract,
  sendInstantPayment,
  mintMockUSDC,
  getPublicProvider
} from '../lib/contracts'

export default function Send() {
  const { authenticated, login } = usePrivy()
  const { wallets } = useWallets()
  const location = useLocation()
  
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [sendType, setSendType] = useState('instant') // 'instant' or 'stream'
  const [duration, setDuration] = useState('30') // days for streaming
  
  // Transaction state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [txStatus, setTxStatus] = useState('')
  const [txHash, setTxHash] = useState('')
  const [streamId, setStreamId] = useState(null)

  // Handle pre-filled data from URL params (primary) or navigation state (fallback)
  useEffect(() => {
    // Priority 1: URL query parameters (survives refresh)
    const searchParams = new URLSearchParams(location.search)
    const urlRecipient = searchParams.get('recipient')
    const urlType = searchParams.get('type')
    
    if (urlRecipient) {
      setRecipient(urlRecipient)
    } else if (location.state?.recipient) {
      // Priority 2: Navigation state (backwards compatibility)
      setRecipient(location.state.recipient)
    }
    
    if (urlType) {
      setSendType(urlType)
    } else if (location.state?.sendType) {
      setSendType(location.state.sendType)
    }
  }, [location.search, location.state])

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

  const labelStyles = {
    display: 'block',
    marginBottom: 'var(--spacing-sm)',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-semibold)',
  }

  const calculateStreamRate = () => {
    if (!amount || !duration || sendType !== 'stream') return 0
    const totalSeconds = parseFloat(duration) * 24 * 60 * 60
    return (parseFloat(amount) / totalSeconds).toFixed(8)
  }

  const handleUsernameSelect = (username, address) => {
    setRecipient(`@${username}`)
  }

  const handleMint = async () => {
    if (!authenticated || !wallets.length) {
      setError('Please sign in to mint test funds')
      return
    }

    try {
      setLoading(true)
      setError('')
      setTxStatus('Minting 1,000 mUSDC...')
      setShowModal(true)
      
      const signer = await getSigner(wallets[0])
      const result = await mintMockUSDC(signer)
      
      if (!result.success) throw new Error(result.error)
      
      setTxStatus('✅ Successfully minted 1,000 mUSDC!')
      setTxHash(result.txHash)
    } catch (e) {
      setError(e.message)
      setTxStatus('❌ Minting failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!authenticated || !wallets.length) {
      setError('Please sign in to send payments')
      return
    }

    setError('')
    setLoading(true)
    setShowModal(true)
    setTxStatus('Validating recipient...')

    try {
      // ====== 1. Validate Recipient ======
      const validation = await validateRecipient(recipient)
      
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid recipient')
      }

      const recipientAddress = validation.address
      console.log(`Sending to ${validation.type}: ${recipientAddress}`)

      // ====== 2. Validate Amount ======
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid amount')
      }

      // ====== 3. Get Signer ======
      const signer = await getSigner(wallets[0])
      const senderAddress = await signer.getAddress()

      if (sendType === 'stream' && recipientAddress.toLowerCase() === senderAddress.toLowerCase()) {
        throw new Error('You cannot create a stream to yourself')
      }

      // ====== 4. Check USDC Balance ======
      setTxStatus('Checking USDC balance...')
      // Use PublicProvider for reading state to avoid RPC errors from user wallet
      const usdcContract = getUSDCContract(getPublicProvider())
      const balance = await usdcContract.balanceOf(senderAddress)
      const balanceFormatted = parseFloat(ethers.formatUnits(balance, 6))

      if (balanceFormatted < amountNum) {
        throw new Error(`Insufficient USDC balance. You have ${balanceFormatted.toFixed(2)} USDC but need ${amountNum} USDC`)
      }

      // ====== 5. Execute Payment ======
      if (sendType === 'instant') {
        // Unified Payment Protocol
        // 1. If sending to SELF: Use Direct Transfer (Contract forbids self-streaming)
        // 2. If sending to OTHERS: Use 1-second Stream (Unified Dashboard Experience)
        
        const isSelfTransfer = recipientAddress.toLowerCase() === senderAddress.toLowerCase()

        if (isSelfTransfer) {
          setTxStatus('Preparing direct transfer (Self)...')
          const result = await sendInstantPayment(signer, recipientAddress, amountNum)
          
          if (!result.success) throw new Error(result.error || 'Payment failed')
          setTxHash(result.txHash)
          setTxStatus('✅ Transfer sent successfully!')
        } else {
          setTxStatus('Depositing funds (Unified Protocol)...')
          // Create 1-second stream
          const result = await createStream(signer, recipientAddress, amountNum, 1, true)
          
          if (!result.success) throw new Error(result.error || 'Deposit failed')
          
          setTxHash(result.txHash)
          setTxStatus('✅ Funds deposited successfully! Recipient can claim on dashboard.')
        }
        
      } else {
        // Streaming Payment
        setTxStatus('Preparing stream...')
        
        const durationNum = parseFloat(duration)
        if (isNaN(durationNum) || durationNum <= 0) {
          throw new Error('Please enter a valid duration')
        }

        const result = await createStream(signer, recipientAddress, amountNum, durationNum)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create stream')
        }

        setTxHash(result.txHash)
        setStreamId(result.streamId)
        setTxStatus('✅ Stream created successfully!')
      }

      // Reset form
      setTimeout(() => {
        setRecipient('')
        setAmount('')
        setDuration('30')
      }, 2000)

    } catch (err) {
      console.error('Payment error:', err)
      setError(err.message || 'An error occurred while processing payment')
      setTxStatus('❌ Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setTxHash('')
    setStreamId(null)
    setTxStatus('')
    setError('')
  }

  return (
    <div style={containerStyles}>
      <h1 style={headerStyles}>Send Payment</h1>
      <p style={subheadStyles}>
        Send instant payments or create streaming income for family and creators.
      </p>

      <Card padding="xl">
        <div style={toggleContainerStyles} className="toggle-container">
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
          <div>
            <label style={labelStyles}>Recipient Address or Username</label>
            <UsernameAutocomplete
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              onSelect={handleUsernameSelect}
            />
          </div>

          <Input
            label="Amount (USDC)"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
          />
          
          <div style={{ textAlign: 'right', marginTop: '-12px', fontSize: 'var(--font-size-sm)' }}>
            <span style={{ color: 'var(--color-off-black)' }}>Need test funds? </span>
            <button 
              onClick={handleMint}
              type="button"
              style={{ 
                color: 'var(--color-accent)', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                textDecoration: 'underline',
                fontWeight: 'var(--font-weight-medium)',
                padding: 0
              }}
            >
              Mint 1,000 mUSDC
            </button>
          </div>

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

          {error && (
            <div style={{
              padding: 'var(--spacing-md)',
              backgroundColor: '#FEE2E2',
              border: '2px solid #EF4444',
              borderRadius: 'var(--border-radius)',
              color: '#991B1B',
            }}>
              {error}
            </div>
          )}

          {!authenticated ? (
            <Button variant="primary" fullWidth onClick={login}>
              Sign In to Send Payment
            </Button>
          ) : (
            <Button 
              variant="primary" 
              fullWidth
              onClick={handleSend}
              disabled={!recipient || !amount || loading}
            >
              {loading ? 'Processing...' : (sendType === 'instant' ? 'Send Payment' : 'Start Stream')}
            </Button>
          )}
        </div>
      </Card>

      {/* Transaction Status Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={sendType === 'instant' ? 'Instant Payment' : 'Stream Payment'}
      >
        <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          {loading && (
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid var(--color-light-gray)',
              borderTopColor: 'var(--color-accent)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto var(--spacing-xl)'
            }} />
          )}
          
          <p style={{
            fontSize: 'var(--font-size-lg)',
            marginBottom: 'var(--spacing-xl)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            {txStatus}
          </p>

          {error && (
            <div style={{
              color: '#EF4444',
              backgroundColor: '#FEF2F2',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--border-radius)',
              marginBottom: 'var(--spacing-lg)',
              fontSize: 'var(--font-size-sm)',
              border: '1px solid #FECACA'
            }}>
              {error}
            </div>
          )}

          {txHash && (
            <div style={{
              backgroundColor: 'var(--color-light-gray)',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--border-radius)',
              marginBottom: 'var(--spacing-lg)',
              wordBreak: 'break-all'
            }}>
              <div style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-xs)', color: '#666' }}>
                Transaction Hash
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}>
                {txHash.substring(0, 20)}...
              </div>
            </div>
          )}

          {streamId && (
            <div style={{
              backgroundColor: 'var(--color-accent)',
              color: 'white',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--border-radius)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <div style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-xs)' }}>
                Stream ID
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                #{streamId}
              </div>
            </div>
          )}

          {txHash && !loading && (
            <Button
              variant="outline"
              onClick={() => window.open(`https://sepolia.scrollscan.com/tx/${txHash}`, '_blank')}
              style={{ marginBottom: 'var(--spacing-sm)', width: '100%' }}
            >
              View on Scrollscan →
            </Button>
          )}

          {!loading && (
            <Button variant="primary" onClick={closeModal} style={{ width: '100%' }}>
              Close
            </Button>
          )}
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </Modal>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 480px) {
          .toggle-container {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
