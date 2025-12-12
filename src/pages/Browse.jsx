import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWallets } from '@privy-io/react-auth'
import Card from '../components/Card'
import Input from '../components/Input'
import { getAllUsernames, getProfileFromChain, getUsername, getSupporterCount } from '../lib/contracts'
import { fetchFromIPFS } from '../lib/pinata'

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState('')
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const { wallets } = useWallets()

  useEffect(() => {
    loadProfiles()
  }, [wallets])

  const inferCategory = (bio) => {
    if (!bio) return 'Creator'
    const b = bio.toLowerCase()
    if (b.includes('art') || b.includes('paint') || b.includes('draw') || b.includes('digital')) return 'Digital Art'
    if (b.includes('code') || b.includes('dev') || b.includes('engineer') || b.includes('web3')) return 'Developer'
    if (b.includes('music') || b.includes('song') || b.includes('audio')) return 'Musician'
    if (b.includes('write') || b.includes('blog') || b.includes('author')) return 'Writer'
    if (b.includes('photo') || b.includes('camera')) return 'Photographer'
    if (b.includes('video') || b.includes('film') || b.includes('stream')) return 'Video Creator'
    return 'Creator'
  }

  const loadProfiles = async () => {
    try {
      setLoading(true)
      
      // 1. Get all indexed usernames
      let indexedUsers = await getAllUsernames()
      
      // 2. Ensure current user is included if they have a profile
      if (wallets && wallets[0]) {
        const address = wallets[0].address
        const hasSelf = indexedUsers.some(u => u.address.toLowerCase() === address.toLowerCase())
        
        if (!hasSelf) {
          try {
            const selfUsername = await getUsername(address)
            if (selfUsername) {
              indexedUsers.push({ username: selfUsername, address })
            }
          } catch (e) {
            console.warn('Could not fetch self username', e)
          }
        }
      }

      // 3. Fetch metadata and stats for all users
      const profilePromises = indexedUsers.map(async (user) => {
        try {
          const cid = await getProfileFromChain(user.address)
          if (!cid) return null

          const metadata = await fetchFromIPFS(cid)
          
                    // Image recovery logic
           let imageUrl = metadata?.imageUrl
           if ((!imageUrl || imageUrl === '' || imageUrl.includes('undefined')) && metadata?.imageCid) {
              const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'
              // Check if gateway already includes protocol
              const gatewayUrl = gateway.startsWith('http') ? gateway : `https://${gateway}`
              imageUrl = `${gatewayUrl}/ipfs/${metadata.imageCid}?img-width=500&img-quality=85&img-format=webp`
           } else if (imageUrl && !imageUrl.startsWith('http')) {
              // If imageUrl exists but doesn't have protocol, add it
              const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'
              const gatewayUrl = gateway.startsWith('http') ? gateway : `https://${gateway}`
              imageUrl = `${gatewayUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
           }

          // Fetch real supporter count
          const supporterCount = await getSupporterCount(user.address)

          return {
            username: user.username,
            name: metadata.name || user.username,
            bio: metadata.bio || 'No bio yet',
            image: imageUrl || null,
            supporters: supporterCount, // Real on-chain data!
            category: inferCategory(metadata.bio), // Inferred from real bio!
            address: user.address
          }
        } catch (err) {
          console.error(`Failed to load profile for ${user.username}:`, err)
          return null
        }
      })

      const results = await Promise.all(profilePromises)
      const validProfiles = results.filter(p => p !== null)
      
      // Remove duplicates
      const uniqueProfiles = validProfiles.filter((profile, index, self) =>
        index === self.findIndex((p) => p.username === profile.username)
      )

      setProfiles(uniqueProfiles.reverse())
    } catch (error) {
      console.error('Error loading profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCreators = profiles.filter(creator => 
    creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const containerStyles = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: 'var(--spacing-3xl) var(--spacing-lg)',
  }

  const headerStyles = {
    fontSize: 'var(--font-size-4xl)',
    fontWeight: 'var(--font-weight-semibold)',
    marginBottom: 'var(--spacing-md)',
  }

  const subheadStyles = {
    fontSize: 'var(--font-size-lg)',
    color: 'var(--color-off-black)',
    marginBottom: 'var(--spacing-2xl)',
  }

  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 'var(--spacing-xl)',
    marginTop: 'var(--spacing-2xl)',
  }

  const creatorCardStyles = {
    padding: 'var(--spacing-lg)',
    border: 'var(--border-width) solid var(--color-black)',
    transition: 'transform var(--transition-base)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block',
    color: 'inherit',
    backgroundColor: 'var(--color-white)',
  }

  const imageStyles = {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    marginBottom: 'var(--spacing-md)',
    backgroundColor: 'var(--color-light-gray)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
  }

  const nameStyles = {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-semibold)',
    marginBottom: 'var(--spacing-xs)',
  }

  const categoryBadgeStyles = {
    display: 'inline-block',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
    padding: 'var(--spacing-xs) var(--spacing-sm)',
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-white)',
    marginBottom: 'var(--spacing-sm)',
  }

  const bioStyles = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-off-black)',
    marginBottom: 'var(--spacing-md)',
    lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    height: '3em', // Force height for 2 lines
  }

  const statsStyles = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-off-black)',
    borderTop: '1px solid var(--color-light-gray)',
    paddingTop: 'var(--spacing-sm)',
    marginTop: 'auto', // Push to bottom
  }

  return (
    <div style={containerStyles}>
      <h1 style={headerStyles}>Discover Creators</h1>
      <p style={subheadStyles}>
        Support artisans and creators around the world with real-time streaming payments.
      </p>

      <Input
        placeholder="Search by name, category, or bio..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        fullWidth
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-4xl)' }}>
          Loading creators...
        </div>
      ) : (
        <div style={gridStyles}>
          {filteredCreators.length > 0 ? (
            filteredCreators.map((creator) => (
              <Link
                key={creator.username}
                to={`/u/${creator.username}`}
                style={creatorCardStyles}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '4px 4px 0 var(--color-black)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {creator.image ? (
                  <img 
                    src={creator.image} 
                    alt={creator.name} 
                    style={imageStyles}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div style={imageStyles}>
                    {creator.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Fallback for broken image */}
                 <div style={{...imageStyles, display: 'none'}}>
                    {creator.name.charAt(0).toUpperCase()}
                 </div>

                <span style={categoryBadgeStyles}>{creator.category}</span>
                <h3 style={nameStyles}>{creator.name}</h3>
                <p style={bioStyles}>{creator.bio}</p>
                <div style={statsStyles}>{creator.supporters} supporters</div>
              </Link>
            ))
          ) : (
             <div style={{gridColumn: '1/-1', textAlign: 'center', padding: 'var(--spacing-3xl)'}}>
               {profiles.length === 0 
                 ? "No profiles found. Create one to be the first!" 
                 : `No creators found matching "${searchQuery}"`}
             </div>
          )}
        </div>
      )}
    </div>
  )
}
