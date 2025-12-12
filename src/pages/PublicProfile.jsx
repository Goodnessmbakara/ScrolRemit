import { useState, useEffect, useCallback, useMemo } from 'react'
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
  // Memoize provider to prevent infinite render loop (provider recreated = new reference = triggers useEffect)
  const provider = useMemo(() => getPublicProvider(), [])
  const { streams } = useStreamingBalance(provider, userAddress, false)

  const loadProfile = useCallback(async () => {
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
  }, [username])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Calculate total received from withdrawn streams
  const totalReceived = streams.reduce((acc, stream) => acc + parseFloat(stream.withdrawn || 0), 0)

  const handleSendTip = () => {
    // Use URL params for reliable data passing (survives refresh)
    navigate(`/send?recipient=${encodeURIComponent(`@${username}`)}&type=instant`)
  }

  const handleStartStream = () => {
    // Use URL params for reliable data passing (survives refresh)
    navigate(`/send?recipient=${encodeURIComponent(`@${username}`)}&type=stream`)
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

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: 'var(--spacing-3xl) var(--spacing-lg)',
    }}>
      {/* Profile Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr',
        gap: 'var(--spacing-2xl)',
        marginBottom: 'var(--spacing-3xl)',
      }} className="profile-header">
        {/* Profile Image - Square with border */}
        {profileData.imageUrl ? (
          <img 
            src={profileData.imageUrl} 
            alt={profileData.name || username}
            style={{
              width: '200px',
              height: '200px',
              objectFit: 'cover',
              border: 'var(--border-width) solid var(--color-black)',
            }}
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextElementSibling.style.display = 'flex'
            }}
          />
        ) : (
          <div style={{
            width: '200px',
            height: '200px',
            border: 'var(--border-width) solid var(--color-black)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-6xl)',
            fontWeight: 'var(--font-weight-bold)',
            backgroundColor: 'var(--color-white)',
          }}>
            {(profileData.name || username).charAt(0).toUpperCase()}
          </div>
        )}
        {/* Fallback for broken image */}
        <div style={{
          width: '200px',
          height: '200px',
          border: 'var(--border-width) solid var(--color-black)',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--font-size-6xl)',
          fontWeight: 'var(--font-weight-bold)',
          backgroundColor: 'var(--color-white)',
        }}>
          {(profileData.name || username).charAt(0).toUpperCase()}
        </div>

        {/* Profile Info */}
        <div>
          <h1 style={{
            fontSize: 'var(--font-size-4xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--spacing-xs)',
          }}>
            {profileData.name || username}
          </h1>
          <p style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-off-black)',
            marginBottom: 'var(--spacing-lg)',
          }}>
            @{username}
          </p>
          {profileData.bio && (
            <p style={{
              fontSize: 'var(--font-size-base)',
              lineHeight: '1.6',
              color: 'var(--color-black)',
              marginBottom: 'var(--spacing-xl)',
            }}>
              {profileData.bio}
            </p>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-md)',
          }} className="cta-grid">
            <button
              onClick={handleSendTip}
              style={{
                padding: 'var(--spacing-md) var(--spacing-lg)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-white)',
                backgroundColor: 'var(--color-accent)',
                border: 'var(--border-width) solid var(--color-black)',
                cursor: 'pointer',
                transition: 'opacity var(--transition-fast)',
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              Send Tip
            </button>
            <button
              onClick={handleStartStream}
              style={{
                padding: 'var(--spacing-md) var(--spacing-lg)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-black)',
                backgroundColor: 'var(--color-white)',
                border: 'var(--border-width) solid var(--color-black)',
                cursor: 'pointer',
                transition: 'transform var(--transition-base)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Start Stream
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-3xl)',
      }} className="stats-grid">
        <div style={{
          padding: 'var(--spacing-lg)',
          border: 'var(--border-width) solid var(--color-black)',
        }}>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-off-black)',
            marginBottom: 'var(--spacing-sm)',
          }}>
            Supporters
          </p>
          <p style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-bold)',
          }}>
            {supporters}
          </p>
        </div>
        <div style={{
          padding: 'var(--spacing-lg)',
          border: 'var(--border-width) solid var(--color-black)',
        }}>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-off-black)',
            marginBottom: 'var(--spacing-sm)',
          }}>
            Total Received
          </p>
          <p style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-accent)',
          }}>
            ${totalReceived.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Support Info Card */}
      <div style={{
        padding: 'var(--spacing-xl)',
        border: 'var(--border-width) solid var(--color-black)',
      }}>
        <h3 style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--spacing-md)',
        }}>
          Support {profileData.name || username}
        </h3>
        <p style={{
          fontSize: 'var(--font-size-base)',
          lineHeight: '1.6',
          color: 'var(--color-off-black)',
        }}>
          When you start a stream or send a tip, {profileData.name || username} will see their balance increase in real-time. 
          Your support goes directly to the creator with no intermediaries, powered by Scroll network.
        </p>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .profile-header {
            grid-template-columns: 1fr !important;
            gap: var(--spacing-xl) !important;
          }
          
          .profile-header img,
          .profile-header > div:first-child {
            margin: 0 auto;
          }

          .stats-grid {
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

