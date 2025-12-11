import { useState, useRef, useEffect } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { ethers } from 'ethers'
import { getProfileRegistryContract, CONTRACTS } from '../lib/contracts'

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
        const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io/')
        const contract = getProfileRegistryContract(provider)
        
        const profileData = await contract.getProfile(address)
        
        // Parse the profile data (returns: cid, username, exists)
        if (profileData && profileData[2]) { // exists = true
          setUsername(profileData[1]) // username
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
        const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io/')
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
    // Show username if available, otherwise email, otherwise address
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
      // Use Privy's built-in wallet export
      // This opens Privy's modal with export options
      if (wallet.exportWallet) {
        await wallet.exportWallet()
      } else {
        // Fallback: open Privy settings
        alert('To export your wallet:\n1. Click your wallet address\n2. Select "Export wallet"\n3. Follow the instructions to reveal your private key or recovery phrase')
      }
    } catch (error) {
      console.error('Error exporting wallet:', error)
      alert('Please use Privy\'s wallet settings to export your private key')
    }
  }

  const buttonStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-md) var(--spacing-lg)',
    backgroundColor: 'var(--color-white)',
    border: '2px solid var(--color-black)',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    fontWeight: 'var(--font-weight-medium)',
    fontSize: 'var(--font-size-sm)',
    transition: 'transform var(--transition-base)',
  }

  const dropdownStyles = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    backgroundColor: 'var(--color-white)',
    border: '2px solid var(--color-black)',
    borderRadius: 'var(--border-radius-md)',
    boxShadow: '4px 4px 0 var(--color-black)',
    padding: 'var(--spacing-lg)',
    minWidth: '320px',
    zIndex: 1000,
  }

  const addressItemStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--spacing-md)',
    backgroundColor: 'var(--color-light-gray)',
    borderRadius: 'var(--border-radius-sm)',
    marginBottom: 'var(--spacing-md)',
  }

  const balanceStyles = {
    padding: 'var(--spacing-md)',
    textAlign: 'center',
    marginBottom: 'var(--spacing-md)',
  }

  const actionButtonStyles = {
    width: '100%',
    padding: 'var(--spacing-md)',
    backgroundColor: 'var(--color-white)',
    border: '2px solid var(--color-black)',
    borderRadius: 'var(--border-radius-sm)',
    cursor: 'pointer',
    fontWeight: 'var(--font-weight-medium)',
    marginBottom: 'var(--spacing-sm)',
    transition: 'all 0.2s',
  }

  const signOutButtonStyles = {
    ...actionButtonStyles,
    backgroundColor: 'var(--color-black)',
    color: 'var(--color-white)',
    marginBottom: 0,
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={buttonStyles}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)'
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
          }}
        />
        <span>{formatAddress(address)}</span>
        <span style={{ fontSize: '12px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div style={dropdownStyles}>
          {/* User Info */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#666', marginBottom: '4px' }}>
              Signed in as
            </div>
            <div style={{ fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-sm)' }}>
              {user?.email?.address || user?.google?.email || 'User'}
            </div>
            {!loadingUsername && username && (
              <div style={{ 
                fontSize: 'var(--font-size-base)', 
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-primary)',
                marginTop: 'var(--spacing-xs)'
              }}>
                @{username}
              </div>
            )}
          </div>

          {/* Wallet Address */}
          <div style={addressItemStyles}>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#666', marginBottom: '4px' }}>
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
                backgroundColor: copied ? 'var(--color-primary)' : 'var(--color-white)',
                color: copied ? 'var(--color-white)' : 'var(--color-black)',
                border: '1px solid var(--color-black)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* Balance */}
          <div style={balanceStyles}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: '#666', marginBottom: '4px' }}>
              Balance
            </div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}>
              {parseFloat(balance).toFixed(4)} ETH
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: '#666' }}>
              Scroll Sepolia
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => window.open(`https://sepolia.scrollscan.com/address/${address}`, '_blank')}
            style={actionButtonStyles}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--color-light-gray)'
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
              e.target.style.backgroundColor = 'var(--color-light-gray)'
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
              e.target.style.backgroundColor = 'var(--color-primary)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--color-black)'
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
