import { useState, useEffect } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { getProfileFromChain } from '../lib/contracts'
import { fetchFromIPFS } from '../lib/pinata'
import CreateProfile from './CreateProfile'

export default function Profile() {
  const { ready, authenticated } = usePrivy()
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      if (!ready) return
      
      if (!authenticated || !wallets.length) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Get wallet address
        const wallet = wallets[0]
        const ethereumProvider = await wallet.getEthereumProvider()
        const address = wallet.address

        console.log('Checking profile for address:', address)

        // Check if profile exists and get CID
        const cid = await getProfileFromChain(address)
        
        if (cid && cid !== '') {
          console.log('Profile CID found:', cid)
          
          // Fetch metadata from IPFS
          try {
            const metadata = await fetchFromIPFS(cid)
            console.log('Profile metadata loaded:', metadata)
            
            setProfileData(metadata)
            setHasProfile(true)
          } catch (ipfsError) {
            console.error('Error fetching profile from IPFS:', ipfsError)
            setError('Failed to load profile metadata from IPFS')
            setHasProfile(false)
          }
        } else {
          console.log('No profile found for this address')
          setHasProfile(false)
        }
      } catch (err) {
        console.error('Error loading profile:', err)
        setError(err.message)
        setHasProfile(false)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [ready, authenticated, wallets])

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
          Loading your profile...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Not authenticated - show create profile
  if (!authenticated) {
    return <CreateProfile />
  }

  // Error state
  if (error) {
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
            ⚠️ Error Loading Profile
          </p>
          <p style={{ color: '#991B1B', fontSize: 'var(--font-size-base)' }}>
            {error}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: 'var(--spacing-md) var(--spacing-xl)',
            backgroundColor: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--border-radius)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    )
  }

  // No profile - show create form
  if (!hasProfile) {
    return <CreateProfile />
  }

  // Has profile - display it
  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: 'var(--spacing-4xl) var(--spacing-lg)',
    }}>
      {/* Profile Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 'var(--spacing-3xl)',
        marginBottom: 'var(--spacing-3xl)',
        textAlign: 'center'
      }}>
        {/* Profile Image */}
        {(() => {
          // Try to get valid image URL, with fallback to imageCid
          let imageUrl = profileData?.imageUrl
          
          // If imageUrl is invalid or contains 'undefined', try to construct from imageCid
          if (!imageUrl || imageUrl === '' || imageUrl.includes('undefined')) {
            if (profileData?.imageCid) {
              const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'
              imageUrl = `https://${gateway}/ipfs/${profileData.imageCid}?img-width=500&img-quality=85&img-format=webp`
              console.log('🔧 Recovered image URL from imageCid:', imageUrl)
            }
          }

          // Render image if we have a valid URL
          if (imageUrl && imageUrl !== '' && !imageUrl.includes('undefined')) {
            return (
              <div style={{
                width: '200px',
                height: '200px',
                margin: '0 auto',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '5px solid var(--color-accent)',
                boxShadow: '0 10px 40px rgba(0, 47, 167, 0.2)'
              }}>
                <img
                  src={imageUrl}
                  alt={profileData.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    console.error('Failed to load profile image:', imageUrl)
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            )
          }

          // Fallback to initial avatar
          return (
            <div style={{
              width: '200px',
              height: '200px',
              margin: '0 auto',
              borderRadius: '50%',
              border: '5px solid var(--color-accent)',
              backgroundColor: 'var(--color-light-gray)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'var(--color-accent)',
              boxShadow: '0 10px 40px rgba(0, 47, 167, 0.2)'
            }}>
              {profileData?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )
        })()}

        {/* Name */}
        <h1 style={{
          fontSize: 'var(--font-size-6xl)',
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--spacing-md)',
          background: 'linear-gradient(135deg, var(--color-black) 0%, var(--color-accent) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {profileData?.name || 'Your Profile'}
        </h1>

        {/* Bio */}
        {profileData?.bio && (
          <p style={{
            fontSize: 'var(--font-size-xl)',
            color: 'var(--color-off-black)',
            lineHeight: '1.7',
            maxWidth: '700px',
            margin: '0 auto var(--spacing-2xl)'
          }}>
            {profileData.bio}
          </p>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              padding: 'var(--spacing-md) var(--spacing-2xl)',
              backgroundColor: 'var(--color-accent)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 8px 24px rgba(0, 47, 167, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => window.location.href = '/send'}
            style={{
              padding: 'var(--spacing-md) var(--spacing-2xl)',
              backgroundColor: 'white',
              color: 'var(--color-accent)',
              border: '2px solid var(--color-accent)',
              borderRadius: 'var(--border-radius)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--color-accent)'
              e.target.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white'
              e.target.style.color = 'var(--color-accent)'
            }}
          >
            💸 Send Payment
          </button>
        </div>
      </div>

      {/* Profile Info Card */}
      <div style={{
        background: 'white',
        border: '2px solid var(--color-black)',
        borderRadius: '16px',
        padding: 'var(--spacing-2xl)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          Profile Information
        </h3>
        
        <div style={{
          display: 'grid',
          gap: 'var(--spacing-md)',
          fontSize: 'var(--font-size-base)'
        }}>
          {profileData?.createdAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-md)', backgroundColor: 'var(--color-light-gray)', borderRadius: '8px' }}>
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Created:</span>
              <span style={{ color: 'var(--color-off-black)' }}>
                {new Date(profileData.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
          {profileData?.version && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-md)', backgroundColor: 'var(--color-light-gray)', borderRadius: '8px' }}>
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Version:</span>
              <span style={{ color: 'var(--color-off-black)' }}>{profileData.version}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
