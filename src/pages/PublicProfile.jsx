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

  // Calculate total received (deposited, not withdrawn!)
  // This shows what supporters have SENT, not what creator has CLAIMED
  
  // DEBUG: Log stream data to see what we're getting
  useEffect(() => {
    if (streams.length > 0) {
      console.log('Stream data:', streams)
      console.log('First stream:', streams[0])
      console.log('Stream deposit values:', streams.map(s => ({ id: s.id, deposit: s.deposit, withdrawn: s.withdrawn })))
    }
  }, [streams])
  
  const totalReceived = streams.reduce((acc, stream) => {
    const depositValue = parseFloat(stream.deposit || 0)
    console.log(`Stream ${stream.id}: deposit=${stream.deposit}, parsed=${depositValue}`)
    return acc + depositValue
  }, 0)

  // Get unique supporters and recent activity
  const uniqueSupporters = [...new Set(streams.map(s => s.sender))].filter(Boolean)
  const recentSupporters = uniqueSupporters.slice(-3).reverse() // Last 3 supporters

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
      {/* Header Section - 3 Column Grid: Avatar | Info | CTAs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr 200px',
        gap: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-3xl)',
        paddingBottom: 'var(--spacing-2xl)',
        borderBottom: 'var(--border-width-thick) solid var(--color-black)',
      }} className="profile-header">
        {/* Profile Image - Larger with thicker border */}
        {profileData.imageUrl ? (
          <img 
            src={profileData.imageUrl} 
            alt={profileData.name || username}
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'cover',
              border: 'var(--border-width-thick) solid var(--color-black)',
            }}
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextElementSibling.style.display = 'flex'
            }}
          />
        ) : (
          <div style={{
            width: '120px',
            height: '120px',
            border: 'var(--border-width-thick) solid var(--color-black)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-5xl)',
            fontWeight: 'var(--font-weight-bold)',
            backgroundColor: 'var(--color-white)',
          }}>
            {(profileData.name || username).charAt(0).toUpperCase()}
          </div>
        )}
        {/* Fallback for broken image */}
        <div style={{
          width: '120px',
          height: '120px',
          border: 'var(--border-width-thick) solid var(--color-black)',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--font-size-5xl)',
          fontWeight: 'var(--font-weight-bold)',
          backgroundColor: 'var(--color-white)',
        }}>
          {(profileData.name || username).charAt(0).toUpperCase()}
        </div>

        {/* Name and bio */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{
            fontSize: 'var(--font-size-4xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--spacing-xs)',
            lineHeight: '1.1',
          }}>
            {profileData.name || username}
          </h1>
          <p style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-off-black)',
            marginBottom: profileData.bio ? 'var(--spacing-sm)' : '0',
          }}>
            @{username}
          </p>
          {profileData.bio && (
            <p style={{
              fontSize: 'var(--font-size-sm)',
              lineHeight: '1.5',
              color: 'var(--color-off-black)',
            }}>
              {profileData.bio}
            </p>
          )}
        </div>

        {/* CTAs on the right */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-sm)',
          justifyContent: 'center',
        }}>
          <button
            onClick={handleSendTip}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-white)',
              backgroundColor: 'var(--color-accent)',
              border: 'var(--border-width) solid var(--color-black)',
              cursor: 'pointer',
              transition: 'opacity var(--transition-fast)',
              width: '100%',
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            Send Tip
          </button>
          <button
            onClick={handleStartStream}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-black)',
              backgroundColor: 'var(--color-white)',
              border: 'var(--border-width) solid var(--color-black)',
              cursor: 'pointer',
              transition: 'transform var(--transition-base)',
              width: '100%',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
          >
            Start Stream
          </button>
        </div>
      </div>

      {/* Horizontal Stats Bar */}
      <div style={{
        display: 'flex',
        border: 'var(--border-width) solid var(--color-black)',
        marginBottom: 'var(--spacing-2xl)',
      }}>
        <div style={{
          flex: 1,
          padding: 'var(--spacing-lg)',
          borderRight: 'var(--border-width) solid var(--color-black)',
        }}>
          <p style={{
            fontSize: 'var(--font-size-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-off-black)',
            marginBottom: 'var(--spacing-xs)',
            fontWeight: 'var(--font-weight-medium)',
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
          flex: 1,
          padding: 'var(--spacing-lg)',
        }}>
          <p style={{
            fontSize: 'var(--font-size-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-off-black)',
            marginBottom: 'var(--spacing-xs)',
            fontWeight: 'var(--font-weight-medium)',
          }}>
            Total Received
          </p>
          <p style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-accent)',
          }}>
            ${totalReceived.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Recent Supporters Section */}
      {recentSupporters.length > 0 && (
        <div style={{
          padding: 'var(--spacing-lg)',
          border: 'var(--border-width) solid var(--color-black)',
          marginBottom: 'var(--spacing-2xl)',
        }}>
          <h3 style={{
            fontSize: 'var(--font-size-sm)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--spacing-md)',
          }}>
            Recent Supporters
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-sm)',
          }}>
            {recentSupporters.map((supporter, index) => (
              <div key={index} style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'monospace',
                color: 'var(--color-off-black)',
                padding: 'var(--spacing-xs) 0',
                borderBottom: index < recentSupporters.length - 1 ? '1px solid var(--color-off-black)' : 'none',
              }}>
                {supporter.slice(0, 6)}...{supporter.slice(-4)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About Section */}
      <div style={{
        padding: 'var(--spacing-lg)',
        border: 'var(--border-width) solid var(--color-black)',
      }}>
        <h3 style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--spacing-sm)',
        }}>
          How It Works
        </h3>
        <p style={{
          fontSize: 'var(--font-size-sm)',
          lineHeight: '1.6',
          color: 'var(--color-off-black)',
        }}>
          Support {profileData.name || username} with real-time streaming payments. 
          Send an instant tip or start a continuous payment stream. All transactions 
          are direct, transparent, and powered by Scroll network.
        </p>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .profile-header {
            grid-template-columns: 1fr !important;
            gap: var(--spacing-lg) !important;
          }
          
          h1 {
            font-size: var(--font-size-3xl) !important;
          }
        }
      `}</style>
    </div>
  )
}
