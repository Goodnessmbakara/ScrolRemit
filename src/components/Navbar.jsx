import { Link } from 'react-router-dom'
import Button from './Button'
import '../index.css'

export default function Navbar({ walletConnected = false, onConnectWallet, userAddress }) {
  const navStyles = {
    backgroundColor: 'var(--color-white)',
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
              height: '48px',
              width: 'auto',
            }}
          />
        </Link>

        <div style={navLinksStyles}>
          {walletConnected && (
            <>
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
