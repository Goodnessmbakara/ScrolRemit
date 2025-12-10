import { createContext, useContext, useState, useEffect } from 'react'
import { connectWallet, getCurrentAddress, getBalance, onAccountsChanged, onChainChanged, removeListeners } from '../lib/web3'
import { BrowserProvider } from 'ethers'

const WalletContext = createContext()

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}

export function WalletProvider({ children }) {
  const [connected, setConnected] = useState(false)
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState('0')
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)

  // Check if wallet is already connected on mount
  useEffect(() => {
    async function checkConnection() {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts.length > 0) {
            const provider = new BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const addr = await signer.getAddress()
            const bal = await getBalance(addr)
            
            setConnected(true)
            setAddress(addr)
            setBalance(bal)
            setProvider(provider)
            setSigner(signer)
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err)
        }
      }
    }
    
    checkConnection()
  }, [])

  // Set up listeners
  useEffect(() => {
    onAccountsChanged(async (accounts) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        const provider = new BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const addr = await signer.getAddress()
        const bal = await getBalance(addr)
        
        setAddress(addr)
        setBalance(bal)
        setSigner(signer)
      }
    })

    onChainChanged(() => {
      window.location.reload()
    })

    return () => {
      removeListeners()
    }
  }, [])

  const connect = async () => {
    setIsConnecting(true)
    setError(null)
    
    try {
      const { address: addr, provider: prov, signer: sign } = await connectWallet()
      const bal = await getBalance(addr)
      
      setConnected(true)
      setAddress(addr)
      setBalance(bal)
      setProvider(prov)
      setSigner(sign)
    } catch (err) {
      setError(err.message)
      console.error('Failed to connect wallet:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setConnected(false)
    setAddress('')
    setBalance('0')
    setProvider(null)
    setSigner(null)
  }

  const refreshBalance = async () => {
    if (address) {
      const bal = await getBalance(address)
      setBalance(bal)
    }
  }

  const value = {
    connected,
    address,
    balance,
    provider,
    signer,
    isConnecting,
    error,
    connect,
    disconnect,
    refreshBalance
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
