import { useParams } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'

export default function PublicProfile() {
  const { username } = useParams()

  // Mock data - would come from blockchain/IPFS in production
  const profile = {
    name: 'Maria Rodriguez',
    username: username,
    bio: 'Traditional pottery artisan from Oaxaca. Creating handcrafted ceramics using ancestral techniques passed down through generations. Each piece tells a story of our cultural heritage.',
    image: '/hero-artisan.png',
    supporters: 47,
    totalReceived: '1,245.50',
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
      <div style={profileHeaderStyles}>
        <img 
          src={profile.image} 
          alt={profile.name}
          style={imageStyles}
        />
        
        <div>
          <h1 style={nameStyles}>{profile.name}</h1>
          <p style={usernameStyles}>@{profile.username}</p>
          <p style={bioStyles}>{profile.bio}</p>

          <div style={statsStyles}>
            <div style={statItemStyles}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-off-black)', marginBottom: 'var(--spacing-xs)' }}>
                Supporters
              </p>
              <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)' }}>
                {profile.supporters}
              </p>
            </div>
            <div style={statItemStyles}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-off-black)', marginBottom: 'var(--spacing-xs)' }}>
                Total Received
              </p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-accent)' }}>
                ${profile.totalReceived}
              </p>
            </div>
          </div>

          <div style={ctaGridStyles}>
            <Button variant="primary" fullWidth>
              Send Tip
            </Button>
            <Button variant="outline" fullWidth>
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
          Support {profile.name}
        </h3>
        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-off-black)', lineHeight: '1.6' }}>
          When you start a stream or send a tip, {profile.name} will see their balance increase in real-time. 
          Your support goes directly to the creator with no intermediaries, powered by Scroll network.
        </p>
      </Card>
    </div>
  )
}
