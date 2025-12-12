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
    <>
      {/* Gradient Hero Background */}
      <div style={{
        background: 'linear-gradient(135deg, #0052FF 0%, #8B5CF6 100%)',
        minHeight: '280px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative floating shapes */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '10%',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '15%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          filter: 'blur(50px)',
        }} />
      </div>

      {/* Main Profile Card - Floating with overlap */}
      <div style={{
        maxWidth: '900px',
        margin: '-120px auto 0',
        padding: '0 var(--spacing-lg) var(--spacing-3xl)',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: 'var(--spacing-3xl) var(--spacing-2xl)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 40px rgba(139, 92, 246, 0.1)',
          textAlign: 'center',
        }} className="profile-card">
          {/* Circular Avatar with Gradient Ring */}
          <div style={{
            display: 'inline-block',
            position: 'relative',
            marginBottom: 'var(--spacing-xl)',
          }}>
            {profileData.imageUrl ? (
              <>
                <img 
                  src={profileData.imageUrl} 
                  alt={profileData.name || username}
                  style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '6px solid transparent',
                    background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #0052FF, #8B5CF6) border-box',
                    transition: 'transform 0.3s ease',
                  }}
                  className="profile-avatar"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextElementSibling.style.display = 'flex'
                  }}
                />
                <div style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '72px',
                  fontWeight: 'bold',
                  color: 'white',
                  background: 'linear-gradient(135deg, #0052FF, #8B5CF6)',
                  border: '6px solid rgba(255, 255, 255, 0.3)',
                }}>
                  {(profileData.name || username).charAt(0).toUpperCase()}
                </div>
              </>
            ) : (
              <div style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '72px',
                fontWeight: 'bold',
                color: 'white',
                background: 'linear-gradient(135deg, #0052FF, #8B5CF6)',
                border: '6px solid rgba(255, 255, 255, 0.3)',
              }}>
                {(profileData.name || username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name with Gradient Text */}
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            marginBottom: 'var(--spacing-xs)',
            background: 'linear-gradient(135deg, #0052FF, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {profileData.name || username}
          </h1>

          {/* Username */}
          <p style={{
            fontSize: 'var(--font-size-xl)',
            color: '#6B7280',
            marginBottom: 'var(--spacing-lg)',
            fontWeight: '500',
          }}>
            @{username}
          </p>

          {/* Bio */}
          {profileData.bio && (
            <p style={{
              fontSize: 'var(--font-size-base)',
              lineHeight: '1.7',
              color: '#4B5563',
              marginBottom: 'var(--spacing-2xl)',
              maxWidth: '600px',
              margin: '0 auto var(--spacing-2xl)',
            }}>
              {profileData.bio}
            </p>
          )}

          {/* Stats Grid with Icons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-2xl)',
            maxWidth: '500px',
            margin: '0 auto var(--spacing-2xl)',
          }} className="stats-grid">
            <div style={{
              padding: 'var(--spacing-xl)',
              background: 'linear-gradient(135deg, #F0F9FF 0%, #E0E7FF 100%)',
              borderRadius: '16px',
              border: '2px solid rgba(0, 82, 255, 0.1)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }} className="stat-card">
              <div style={{
                fontSize: '32px',
                marginBottom: 'var(--spacing-sm)',
              }}>👥</div>
              <p style={{
                fontSize: '42px',
                fontWeight: '800',
                color: '#0052FF',
                marginBottom: 'var(--spacing-xs)',
                lineHeight: '1',
              }}>
                {supporters}
              </p>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                color: '#6B7280',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Supporters
              </p>
            </div>

            <div style={{
              padding: 'var(--spacing-xl)',
              background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
              borderRadius: '16px',
              border: '2px solid rgba(16, 185, 129, 0.1)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }} className="stat-card">
              <div style={{
                fontSize: '32px',
                marginBottom: 'var(--spacing-sm)',
              }}>💰</div>
              <p style={{
                fontSize: '42px',
                fontWeight: '800',
                color: '#10B981',
                marginBottom: 'var(--spacing-xs)',
                lineHeight: '1',
              }}>
                ${totalReceived.toFixed(2)}
              </p>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                color: '#6B7280',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Total Received
              </p>
            </div>
          </div>

          {/* CTA Buttons with Gradients */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--spacing-md)',
            maxWidth: '600px',
            margin: '0 auto',
          }} className="cta-grid">
            <button
              onClick={handleSendTip}
              style={{
                padding: 'var(--spacing-lg) var(--spacing-xl)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: '700',
                color: 'white',
                background: 'linear-gradient(135deg, #0052FF 0%, #0041CC 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 82, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--spacing-sm)',
              }}
              className="cta-button-primary"
            >
              <span style={{ fontSize: '20px' }}>💸</span>
              Send Tip
            </button>
            <button
              onClick={handleStartStream}
              style={{
                padding: 'var(--spacing-lg) var(--spacing-xl)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: '700',
                color: '#0052FF',
                background: 'white',
                border: '3px solid #0052FF',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--spacing-sm)',
              }}
              className="cta-button-secondary"
            >
              <span style={{ fontSize: '20px' }}>🌊</span>
              Start Stream
            </button>
          </div>
        </div>

        {/* Support Info Card */}
        <div style={{
          marginTop: 'var(--spacing-2xl)',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          borderRadius: '20px',
          padding: 'var(--spacing-2xl)',
          border: '2px solid #E2E8F0',
        }}>
          <h3 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: '700',
            marginBottom: 'var(--spacing-md)',
            color: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
          }}>
            <span style={{ fontSize: '28px' }}>✨</span>
            Support {profileData.name || username}
          </h3>
          <p style={{
            fontSize: 'var(--font-size-base)',
            color: '#475569',
            lineHeight: '1.7',
          }}>
            When you start a stream or send a tip, {profileData.name || username} will see their balance increase in real-time. 
            Your support goes directly to the creator with no intermediaries, powered by <strong>Scroll network</strong>.
          </p>
        </div>
      </div>

      {/* Enhanced Styles */}
      <style>{`
        .profile-avatar:hover {
          transform: scale(1.05);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .cta-button-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 82, 255, 0.6);
        }

        .cta-button-secondary:hover {
          background: linear-gradient(135deg, #0052FF 0%, #0041CC 100%);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 82, 255, 0.4);
        }

        @media (max-width: 768px) {
          .profile-card {
            padding: var(--spacing-2xl) var(--spacing-lg) !important;
          }

          .stats-grid {
            grid-template-columns: 1fr !important;
          }

          .cta-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  )
}

