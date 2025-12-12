import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import { getUsernameAddress, getProfileFromChain, getSupporterCount, getPublicProvider } from '../lib/contracts'
import { fetchFromIPFS } from '../lib/pinata'
import { useStreamingBalance } from '../hooks/useBalance'

export default function PublicProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [userAddress, setUserAddress] = useState('')
  const [supporters, setSupporters] = useState(0)

  // Get streaming data for total received calculation
  const provider = getPublicProvider()
  const { streams } = useStreamingBalance(provider, userAddress, false)

  useEffect(() => {
    loadProfile()
  }, [username])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Get address from username
      const address = await getUsernameAddress(username)
      if (!address) {
        setError('User not found')
        setLoading(false)
        return
      }
      setUserAddress(address)

      // 2. Get profile CID from blockchain
      const cid = await getProfileFromChain(address)
      if (!cid) {
        setError('Profile not found')
        setLoading(false)
        return
      }

      // 3. Fetch metadata from IPFS
      const metadata = await fetchFromIPFS(cid)
      
      // 4. Handle image URL (avoid double https)
      let imageUrl = metadata?.imageUrl
      if ((!imageUrl || imageUrl === '' || imageUrl.includes('undefined')) && metadata?.imageCid) {
        const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'
        const gatewayUrl = gateway.startsWith('http') ? gateway : `https://${gateway}`
        imageUrl = `${gatewayUrl}/ipfs/${metadata.imageCid}?img-width=500&img-quality=85&img-format=webp`
      } else if (imageUrl && !imageUrl.startsWith('http')) {
        const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'
        const gatewayUrl = gateway.startsWith('http') ? gateway : `https://${gateway}`
        imageUrl = `${gatewayUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
      }

      setProfileData({
        ...metadata,
        imageUrl,
        username
      })

      // 5. Get supporter count
      const count = await getSupporterCount(address)
      setSupporters(count)

      setLoading(false)
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile')
      setLoading(false)
    }
  }

  // Calculate total received from withdrawn streams
  const totalReceived = streams.reduce((acc, stream) => acc + parseFloat(stream.withdrawn || 0), 0)

  const handleSendTip = () => {
    navigate('/send', { state: { recipient: `@${username}`, sendType: 'instant' } })
  }

  const handleStartStream = () => {
    navigate('/send', { state: { recipient: `@${username}`, sendType: 'stream' } })
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        flexDirection: 'column',
        gap: 'var(--spacing-lg)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid var(--color-light-gray)',
          borderTopColor: 'var(--color-accent)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-off-black)' }}>
          Loading profile...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Error state
  if (error || !profileData) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: 'var(--spacing-3xl) var(--spacing-lg)',
        textAlign: 'center'
      }}>
        <div style={{
          padding: 'var(--spacing-2xl)',
          backgroundColor: '#FEE2E2',
          border: '2px solid #EF4444',
          borderRadius: '12px',
          marginBottom: 'var(--spacing-xl)'
        }}>
          <p style={{ color: '#991B1B', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-md)' }}>
            ⚠️ {error || 'Profile not found'}
          </p>
          <p style={{ color: '#991B1B', fontSize: 'var(--font-size-base)' }}>
            The username "@{username}" doesn't exist or hasn't created a profile yet.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/browse')}>
          ← Back to Browse
        </Button>
      </div>
    )
  }

  const containerStyles = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: 'var(--spacing-3xl) var(--spacing-lg)',
  }

  const profileHeaderStyles = {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: 'var(--spacing-2xl)',
    marginBottom: 'var(--spacing-3xl)',
  }

  const imageStyles = {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'cover',
    border: 'var(--border-width) solid var(--color-black)',
  }

  const imagePlaceholderStyles = {
    width: '100%',
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '72px',
    fontWeight: 'bold',
    color: 'var(--color-accent)',
    backgroundColor: 'var(--color-light-gray)',
    border: 'var(--border-width) solid var(--color-black)',
  }

  const nameStyles = {
    fontSize: 'var(--font-size-4xl)',
    fontWeight: 'var(--font-weight-bold)',
    marginBottom: 'var(--spacing-xs)',
  }

  const usernameStyles = {
    fontSize: 'var(--font-size-lg)',
    color: 'var(--color-off-black)',
    marginBottom: 'var(--spacing-lg)',
  }

  const bioStyles = {
    fontSize: 'var(--font-size-base)',
    lineHeight: '1.7',
    color: 'var(--color-off-black)',
    marginBottom: 'var(--spacing-xl)',
  }

  const statsStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--spacing-lg)',
    marginBottom: 'var(--spacing-xl)',
  }

  const statItemStyles = {
    padding: 'var(--spacing-md)',
    border: 'var(--border-width) solid var(--color-black)',
  }

  const ctaGridStyles = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--spacing-md)',
  }

  return (
    <div style={containerStyles}>
      <div style={profileHeaderStyles} className="profile-header">
        {profileData.imageUrl ? (
          <img 
            src={profileData.imageUrl} 
            alt={profileData.name || username}
            style={imageStyles}
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextElementSibling.style.display = 'flex'
            }}
          />
        ) : (
          <div style={imagePlaceholderStyles}>
            {(profileData.name || username).charAt(0).toUpperCase()}
          </div>
        )}
        {/* Fallback for broken image */}
        <div style={{...imagePlaceholderStyles, display: 'none'}}>
          {(profileData.name || username).charAt(0).toUpperCase()}
        </div>
        
        <div>
          <h1 style={nameStyles}>{profileData.name || username}</h1>
          <p style={usernameStyles}>@{username}</p>
          <p style={bioStyles}>{profileData.bio || 'No bio yet'}</p>

          <div style={statsStyles} className="profile-stats">
            <div style={statItemStyles}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-off-black)', marginBottom: 'var(--spacing-xs)' }}>
                Supporters
              </p>
              <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)' }}>
                {supporters}
              </p>
            </div>
            <div style={statItemStyles}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-off-black)', marginBottom: 'var(--spacing-xs)' }}>
                Total Received
              </p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-accent)' }}>
                ${totalReceived.toFixed(2)}
              </p>
            </div>
          </div>

          <div style={ctaGridStyles} className="cta-grid">
            <Button variant="primary" fullWidth onClick={handleSendTip}>
              Send Tip
            </Button>
            <Button variant="outline" fullWidth onClick={handleStartStream}>
              Start Stream
            </Button>
          </div>
        </div>
      </div>

      <Card padding="lg">
        <h3 style={{ 
          fontSize: 'var(--font-size-2xl)', 
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--spacing-md)',
        }}>
          Support {profileData.name || username}
        </h3>
        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-off-black)', lineHeight: '1.6' }}>
          When you start a stream or send a tip, {profileData.name || username} will see their balance increase in real-time. 
          Your support goes directly to the creator with no intermediaries, powered by Scroll network.
        </p>
      </Card>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .profile-header {
            grid-template-columns: 1fr !important;
            gap: var(--spacing-xl) !important;
          }
          
          .profile-stats {
            grid-template-columns: 1fr !important;
          }
          
          .cta-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

