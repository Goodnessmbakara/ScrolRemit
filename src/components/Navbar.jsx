import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import Button from './Button'
import WalletDropdown from './WalletDropdown'
import '../index.css'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { ready, authenticated, login, logout, user } = usePrivy()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navStyles = {
    backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.85)' : 'var(--color-white)',
    backdropFilter: isScrolled ? 'blur(10px)' : 'none',
    transition: 'all var(--transition-base)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  }

  const containerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--spacing-xl) var(--spacing-xl)',
    maxWidth: '1280px',
    margin: '0 auto',
  }

  const logoStyles = {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'var(--color-black)',
  }

  const navLinksStyles = {
    display: 'flex',
    gap: 'var(--spacing-xl)',
    alignItems: 'center',
  }

  const linkStyles = {
    textDecoration: 'none',
    color: 'var(--color-black)',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-medium)',
    transition: 'color var(--transition-base)',
  }

  return (
    <nav style={navStyles}>
      <div style={containerStyles}>
        <Link to="/" style={logoStyles}>
          <img 
            src="/logo.png" 
            alt="ScrolRemit" 
            style={{
              height: '64px',
              width: 'auto',
            }}
          />
        </Link>

        <div style={navLinksStyles}>
          {authenticated && ready && (
            <>
              <Link to="/browse" style={linkStyles}>Browse</Link>
              <Link to="/dashboard" style={linkStyles}>Dashboard</Link>
              <Link to="/send" style={linkStyles}>Send</Link>
              <Link to="/profile" style={linkStyles}>Profile</Link>
            </>
          )}

          {ready && (
            authenticated ? (
              <WalletDropdown user={user} logout={logout} />
            ) : (
              <Button 
                variant="primary" 
                onClick={login}
                style={{ 
                  paddingLeft: 'var(--spacing-3xl)',
                  paddingRight: 'var(--spacing-3xl)',
                  minWidth: '140px'
                }}
              >
                Sign In
              </Button>
            )
          )}
        </div>
      </div>
    </nav>
  )
}
