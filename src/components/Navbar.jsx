import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import Button from './Button'
import WalletDropdown from './WalletDropdown'
import '../index.css'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { ready, authenticated, login, logout, user } = usePrivy()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when clicking outside or on link
  const closeMobileMenu = () => setMobileMenuOpen(false)

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

  const desktopNavLinksStyles = {
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

  const hamburgerStyles = {
    display: 'none',
    flexDirection: 'column',
    gap: '6px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    minWidth: '44px',
    minHeight: '44px',
    justifyContent: 'center',
    alignItems: 'center',
  }

  const hamburgerLineStyles = {
    width: '24px',
    height: '2px',
    backgroundColor: 'var(--color-black)',
    transition: 'all var(--transition-base)',
  }

  const mobileMenuStyles = {
    position: 'fixed',
    top: 0,
    right: mobileMenuOpen ? '0' : '-100%',
    width: '70%',
    maxWidth: '300px',
    height: '100vh',
    backgroundColor: 'var(--color-white)',
    boxShadow: mobileMenuOpen ? '-2px 0 10px rgba(0,0,0,0.1)' : 'none',
    transition: 'right var(--transition-slow)',
    zIndex: 1001,
    padding: 'var(--spacing-2xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-lg)',
  }

  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: mobileMenuOpen ? 'block' : 'none',
  }

  const mobileNavLinkStyles = {
    ...linkStyles,
    display: 'block',
    padding: 'var(--spacing-md)',
    borderBottom: '1px solid var(--color-light-gray)',
  }

  return (
    <>
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
              className="logo"
            />
          </Link>

          {/* Desktop Navigation */}
          <div style={desktopNavLinksStyles} className="desktop-nav">
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

          {/* Hamburger Icon (Mobile) */}
          <button 
            style={hamburgerStyles} 
            className="hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span style={hamburgerLineStyles}></span>
            <span style={hamburgerLineStyles}></span>
            <span style={hamburgerLineStyles}></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div style={overlayStyles} onClick={closeMobileMenu}></div>

      {/* Mobile Menu Drawer */}
      <div style={mobileMenuStyles}>
        <button
          onClick={closeMobileMenu}
          style={{
            alignSelf: 'flex-end',
            background: 'none',
            border: 'none',
            fontSize: '32px',
            cursor: 'pointer',
            minWidth: '44px',
            minHeight: '44px',
          }}
        >
          ×
        </button>

        {authenticated && ready ? (
          <>
            <Link to="/browse" style={mobileNavLinkStyles} onClick={closeMobileMenu}>
              Browse
            </Link>
            <Link to="/dashboard" style={mobileNavLinkStyles} onClick={closeMobileMenu}>
              Dashboard
            </Link>
            <Link to="/send" style={mobileNavLinkStyles} onClick={closeMobileMenu}>
              Send
            </Link>
            <Link to="/profile" style={mobileNavLinkStyles} onClick={closeMobileMenu}>
              Profile
            </Link>
            <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-lg)' }}>
              <WalletDropdown user={user} logout={logout} />
            </div>
          </>
        ) : (
          ready && (
            <Button 
              variant="primary" 
              onClick={() => {
                login()
                closeMobileMenu()
              }}
              fullWidth
            >
              Sign In
            </Button>
          )
        )}
      </div>

      <style>{`
        /* Mobile responsive navigation */
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          
          .hamburger {
            display: flex !important;
          }
          
          .logo {
            height: 48px !important;
          }
        }
        
        @media (min-width: 769px) {
          .hamburger {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}
