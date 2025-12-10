import { ethers } from 'ethers'

// Scroll Sepolia testnet configuration
export const SCROLL_SEPOLIA = {
  chainId: '0x8274F', // 534351 in hex
  chainName: 'Scroll Sepolia Testnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://sepolia-rpc.scroll.io/'],
  blockExplorerUrls: ['https://sepolia.scrollscan.dev/']
}

// Connect to wallet (MetaMask)
export async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask not installed. Please install MetaMask to use ScrolRemit.')
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    })

    // Check if on correct network
   await switchToScrollSepolia()

    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const address = await signer.getAddress()

    return {
      address,
      provider,
      signer
    }
  } catch (error) {
    console.error('Error connecting wallet:', error)
    throw error
  }
}

// Switch to Scroll Sepolia network
export async function switchToScrollSepolia() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SCROLL_SEPOLIA.chainId }],
    })
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [SCROLL_SEPOLIA],
        })
      } catch (addError) {
        throw addError
      }
    } else {
      throw switchError
    }
  }
}

// Get current wallet address
export async function getCurrentAddress() {
  if (typeof window.ethereum === 'undefined') return null
  
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  return await signer.getAddress()
}

// Get ETH balance
export async function getBalance(address) {
  if (typeof window.ethereum === 'undefined') return '0'
  
  const provider = new ethers.BrowserProvider(window.ethereum)
  const balance = await provider.getBalance(address)
  return ethers.formatEther(balance)
}

// Listen for account changes
export function onAccountsChanged(callback) {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', callback)
  }
}

// Listen for network changes
export function onChainChanged(callback) {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('chainChanged', callback)
  }
}

// Remove listeners
export function removeListeners() {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.removeAllListeners('accountsChanged')
    window.ethereum.removeAllListeners('chainChanged')
  }
}
