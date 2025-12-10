import { useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import Input from '../components/Input'

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState('')

  // Mock creator data - would come from blockchain/IPFS in production
  const creators = [
    {
      username: 'maria',
      name: 'Maria Rodriguez',
      bio: 'Traditional pottery artisan from Oaxaca. Creating handcrafted ceramics using ancestral techniques.',
      image: '/hero-artisan.png',
      supporters: 47,
      category: 'Artisan'
    },
    {
      username: 'james',
      name: 'James Chen',
      bio: 'Contemporary digital artist exploring the intersection of AI and traditional painting.',
      image: '/hero-family.png',
      supporters: 132,
      category: 'Digital Art'
    },
    {
      username: 'amara',
      name: 'Amara Okafor',
      bio: 'Textile designer creating vibrant patterns inspired by West African heritage.',
      image: '/hero-artisan.png',
      supporters: 89,
      category: 'Textile'
    },
    {
      username: 'sofia',
      name: 'Sofia Martinez',
      bio: 'Jewelry maker specializing in sustainable silver and recycled materials.',
      image: '/hero-family.png',
      supporters: 64,
      category: 'Jewelry'
    },
    {
      username: 'kai',
      name: 'Kai Tanaka',
      bio: 'Woodworker crafting minimalist furniture using Japanese joinery techniques.',
      image: '/hero-artisan.png',
      supporters: 103,
      category: 'Woodwork'
    },
    {
      username: 'elena',
      name: 'Elena Volkov',
      bio: 'Illustrator and children\'s book author bringing magical stories to life.',
      image: '/hero-family.png',
      supporters: 215,
      category: 'Illustration'
    },
  ]

  const filteredCreators = creators.filter(creator => 
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
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
  }

  const imageStyles = {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    marginBottom: 'var(--spacing-md)',
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
  }

  const statsStyles = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-off-black)',
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

      <div style={gridStyles}>
        {filteredCreators.map((creator) => (
          <Link
            key={creator.username}
            to={`/u/${creator.username}`}
            style={creatorCardStyles}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <img src={creator.image} alt={creator.name} style={imageStyles} />
            <span style={categoryBadgeStyles}>{creator.category}</span>
            <h3 style={nameStyles}>{creator.name}</h3>
            <p style={bioStyles}>{creator.bio}</p>
            <p style={statsStyles}>{creator.supporters} supporters</p>
          </Link>
        ))}
      </div>

      {filteredCreators.length === 0 && (
        <p style={{ 
          textAlign: 'center', 
          color: 'var(--color-off-black)', 
          padding: 'var(--spacing-4xl) 0',
          fontSize: 'var(--font-size-lg)',
        }}>
          No creators found matching "{searchQuery}"
        </p>
      )}
    </div>
  )
}
