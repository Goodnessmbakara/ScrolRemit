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
        
        // Correctly fetch username using the dedicated function
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
      if (!wallet) {
        alert('No wallet connected')
        return
      }

      // Privy's exportWallet() method opens a secure modal where users can:
      // 1. Authenticate (if needed)
      // 2. View their private key
      // 3. View their recovery phrase (seed phrase/mnemonic)
      // 4. Download wallet data
      
      if (wallet.exportWallet) {
        // This will open Privy's built-in export UI
        await wallet.exportWallet()
      } else {
        // Fallback for wallets that don't support export
        alert(
          '⚠️ Export not available for this wallet type.\n\n' +
          'If you created your wallet with Privy (embedded wallet), you should be able to export it.\n\n' +
          'For imported wallets, please use your original wallet provider to access your private key.'
        )
      }
    } catch (error) {
      console.error('Error exporting wallet:', error)
      
      // Provide helpful error message
      if (error.message?.includes('User rejected')) {
        // User cancelled the export
        return
      }
      
      alert(
        '❌ Unable to export wallet\n\n' +
        'Error: ' + (error.message || 'Unknown error') + '\n\n' +
        'Please try again or contact support if the issue persists.'
      )
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
