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

  const navContainerStyles = {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    padding: 'var(--spacing-md) var(--spacing-lg)',
    backgroundColor: 'transparent',
  }

  // Search bar pill container
  const searchBarStyles = {
    maxWidth: '920px',
    margin: '0 auto',
    backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'var(--color-white)',
    backdropFilter: isScrolled ? 'blur(10px)' : 'none',
    border: '2px solid var(--color-black)',
    borderRadius: '50px',
    padding: '8px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all var(--transition-base)',
    boxShadow: isScrolled ? '0 4px 12px rgba(0, 0, 0, 0.08)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
  }

  const logoStyles = {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'var(--color-black)',
    flexShrink: 0,
  }

  const desktopNavLinksStyles = {
    display: 'flex',
    gap: 'var(--spacing-lg)',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  }

  const linkStyles = {
    textDecoration: 'none',
    color: 'var(--color-black)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    transition: 'color var(--transition-fast)',
    padding: '6px 12px',
    borderRadius: '20px',
  }

  const hamburgerContainerStyles = {
    display: 'none',
    alignItems: 'center',
  }

  const hamburgerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    minWidth: '40px',
    minHeight: '40px',
    justifyContent: 'center',
    alignItems: 'center',
  }

  const hamburgerLineStyles = {
    width: '20px',
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
      <nav style={navContainerStyles}>
        <div style={searchBarStyles} className="search-bar-nav">
          {/* Logo */}
          <Link to="/" style={logoStyles}>
            <img 
              src="/logo.png" 
              alt="ScrolRemit" 
              style={{
                height: '32px',
                width: 'auto',
              }}
              className="logo"
            />
          </Link>

          {/* Desktop Navigation */}
          <div style={desktopNavLinksStyles} className="desktop-nav">
            {authenticated && ready && (
              <>
                <Link to="/browse" style={linkStyles} className="nav-link">Browse</Link>
                <Link to="/dashboard" style={linkStyles} className="nav-link">Dashboard</Link>
                <Link to="/send" style={linkStyles} className="nav-link">Send</Link>
                <Link to="/profile" style={linkStyles} className="nav-link">Profile</Link>
              </>
            )}
          </div>

          {/* Auth Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flexShrink: 0 }}>
            {ready && (
              authenticated ? (
                <WalletDropdown user={user} logout={logout} />
              ) : (
                <Button 
                  variant="primary" 
                  onClick={login}
                  style={{ 
                    padding: '8px 20px',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Sign In
                </Button>
              )
            )}

            {/* Hamburger Icon (Mobile) */}
            <div style={hamburgerContainerStyles} className="hamburger-container">
              <button 
                style={hamburgerStyles}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <span style={hamburgerLineStyles}></span>
                <span style={hamburgerLineStyles}></span>
                <span style={hamburgerLineStyles}></span>
              </button>
            </div>
          </div>
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
        /* Hover effect for nav links */
        .nav-link:hover {
          background-color: rgba(0, 47, 167, 0.08);
        }

        /* Mobile responsive navigation */
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          
          .hamburger-container {
            display: flex !important;
          }
          
          .search-bar-nav {
            padding: 8px 16px !important;
          }
        }
        
        @media (max-width: 480px) {
          .logo {
            height: 28px !important;
          }

          .search-bar-nav {
            max-width: 100% !important;
            margin: 0 8px !important;
          }
        }
      `}</style>
    </>
  )
}
