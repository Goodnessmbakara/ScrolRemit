import { useState, useRef, useEffect } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { ethers } from 'ethers'
import { getProfileRegistryContract, getPublicProvider, CONTRACTS } from '../lib/contracts'

export default function WalletDropdown({ user, logout }) {
  const [isOpen, setIsOpen] = useState(false)
  const [balance, setBalance] = useState('0')
  const [copied, setCopied] = useState(false)
  const [username, setUsername] = useState(null)
  const [loadingUsername, setLoadingUsername] = useState(true)
  const dropdownRef = useRef(null)
  const { wallets } = useWallets()

  const wallet = wallets[0]
  const address = wallet?.address || ''

  // Fetch username from blockchain
  useEffect(() => {
    async function fetchUsername() {
      if (!wallet || CONTRACTS.PROFILE_REGISTRY === '0x0000000000000000000000000000000000000000') {
        setLoadingUsername(false)
        return
      }
      
      try {
        const provider = getPublicProvider() // Use configured RPC from .env
        const contract = getProfileRegistryContract(provider)
        
        const username = await contract.getUsername(address)
        
        if (username) {
          setUsername(username)
        }
      } catch (error) {
        console.error('Error fetching username:', error)
      } finally {
        setLoadingUsername(false)
      }
    }
    
    fetchUsername()
  }, [wallet, address])

  // Fetch balance
  useEffect(() => {
    async function fetchBalance() {
      if (!wallet) return
      try {
        const provider = getPublicProvider() // Use configured RPC from .env
        const bal = await provider.getBalance(address)
        setBalance(ethers.formatEther(bal))
      } catch (error) {
        console.error('Error fetching balance:', error)
      }
    }
    fetchBalance()
  }, [wallet, address])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  const getDisplayName = () => {
    if (username) return `@${username}`
    if (user?.email?.address) return user.email.address
    if (user?.google?.email) return user.google.email
    return formatAddress(address)
  }

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const exportWallet = async () => {
    try {
      if (!wallet) {
        alert('No wallet connected')
        return
      }

      if (wallet.exportWallet) {
        await wallet.exportWallet()
      } else {
        alert(
          '⚠️ Export not available for this wallet type.\n\n' +
          'If you created your wallet with Privy (embedded wallet), you should be able to export it.\n\n' +
          'For imported wallets, please use your original wallet provider to access your private key.'
        )
      }
    } catch (error) {
      console.error('Error exporting wallet:', error)
      
      if (error.message?.includes('User rejected')) {
        return
      }
      
      alert(
        '❌ Unable to export wallet\n\n' +
        'Error: ' + (error.message || 'Unknown error') + '\n\n' +
        'Please try again or contact support if the issue persists.'
      )
    }
  }

  // Search bar pill button with blue edges
  const buttonStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 16px',
    backgroundColor: 'var(--color-white)',
    border: '2px solid var(--color-accent)',
    borderRadius: '30px',
    cursor: 'pointer',
    fontWeight: 'var(--font-weight-medium)',
    fontSize: 'var(--font-size-sm)',
    transition: 'all var(--transition-base)',
    boxShadow: '0 0 0 3px rgba(0, 47, 167, 0.1)',
  }

  // Dropdown menu with blue accents
  const dropdownStyles = {
    position: 'absolute',
    top: 'calc(100% + 12px)',
    right: 0,
    backgroundColor: 'var(--color-white)',
    border: '2px solid var(--color-accent)',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0, 47, 167, 0.15)',
    padding: 'var(--spacing-lg)',
    minWidth: '320px',
    zIndex: 1000,
  }

  const addressItemStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--spacing-md)',
    backgroundColor: 'rgba(0, 47, 167, 0.05)',
    border: '1px solid rgba(0, 47, 167, 0.2)',
    borderRadius: '12px',
    marginBottom: 'var(--spacing-md)',
  }

  const balanceStyles = {
    padding: 'var(--spacing-md)',
    textAlign: 'center',
    marginBottom: 'var(--spacing-md)',
    backgroundColor: 'rgba(0, 47, 167, 0.03)',
    borderRadius: '12px',
  }

  const actionButtonStyles = {
    width: '100%',
    padding: 'var(--spacing-md)',
    backgroundColor: 'var(--color-white)',
    border: '2px solid var(--color-accent)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'var(--font-weight-medium)',
    marginBottom: 'var(--spacing-sm)',
    transition: 'all 0.2s',
    color: 'var(--color-accent)',
  }

  const signOutButtonStyles = {
    ...actionButtonStyles,
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-white)',
    marginBottom: 0,
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={buttonStyles}
        onMouseEnter={(e) => {
          e.target.style.boxShadow = '0 0 0 4px rgba(0, 47, 167, 0.2)'
          e.target.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          e.target.style.boxShadow = '0 0 0 3px rgba(0, 47, 167, 0.1)'
          e.target.style.transform = 'translateY(0)'
        }}
      >
        {/* Blue dot indicator */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-accent)',
          }}
        />
        <span>{getDisplayName()}</span>
        <span style={{ fontSize: '10px', color: 'var(--color-accent)' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div style={dropdownStyles}>
          {/* User Info with blue accent */}
          <div style={{ marginBottom: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-md)', borderBottom: '2px solid rgba(0, 47, 167, 0.1)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: '#666', marginBottom: '4px' }}>
              Signed in as
            </div>
            <div style={{ fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-sm)' }}>
              {user?.email?.address || user?.google?.email || 'User'}
            </div>
            {!loadingUsername && username && (
              <div style={{ 
                fontSize: 'var(--font-size-base)', 
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-accent)',
                marginTop: 'var(--spacing-xs)'
              }}>
                @{username}
              </div>
            )}
          </div>

          {/* Wallet Address with blue accent */}
          <div style={addressItemStyles}>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent)', marginBottom: '4px', fontWeight: 'var(--font-weight-semibold)' }}>
                Wallet Address
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}>
                {formatAddress(address)}
              </div>
            </div>
            <button
              onClick={copyAddress}
              style={{
                padding: '6px 12px',
                backgroundColor: copied ? 'var(--color-accent)' : 'var(--color-white)',
                color: copied ? 'var(--color-white)' : 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                transition: 'all 0.2s',
              }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* Balance with blue background */}
          <div style={balanceStyles}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent)', marginBottom: '4px', fontWeight: 'var(--font-weight-semibold)' }}>
              Balance
            </div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-accent)' }}>
              {parseFloat(balance).toFixed(4)} ETH
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: '#666' }}>
              Scroll Sepolia
            </div>
          </div>

          {/* Action buttons with blue theme */}
          <button
            onClick={() => window.open(`https://sepolia.scrollscan.com/address/${address}`, '_blank')}
            style={actionButtonStyles}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(0, 47, 167, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--color-white)'
            }}
          >
            View on Explorer →
          </button>

          <button
            onClick={exportWallet}
            style={actionButtonStyles}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(0, 47, 167, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--color-white)'
            }}
          >
            🔑 Export Wallet
          </button>

          <button
            onClick={() => {
              logout()
              setIsOpen(false)
            }}
            style={signOutButtonStyles}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--color-black)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--color-accent)'
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
