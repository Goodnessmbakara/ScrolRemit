import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Button from './Button'
import '../index.css'

export default function Navbar({ walletConnected = false, onConnectWallet, userAddress }) {
  const [isScrolled, setIsScrolled] = useState(false)

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
    gap: 'var(--spacing-md)',
    textDecoration: 'none',
  }

  const logoTextStyles = {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-black)',
  }

  const navLinksStyles = {
    display: 'flex',
    gap: 'var(--spacing-xl)',
    alignItems: 'center',
  }

  const linkStyles = {
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-black)',
    textDecoration: 'none',
    transition: 'color var(--transition-fast)',
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
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
          {walletConnected && (
            <>
              <Link to="/browse" style={linkStyles}>Browse</Link>
              <Link to="/dashboard" style={linkStyles}>Dashboard</Link>
              <Link to="/send" style={linkStyles}>Send</Link>
              <Link to="/profile" style={linkStyles}>Profile</Link>
            </>
          )}
          
          {walletConnected ? (
            <Button variant="secondary" onClick={onConnectWallet}>
              {formatAddress(userAddress)}
            </Button>
          ) : (
            <Button variant="primary" onClick={onConnectWallet}>
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
