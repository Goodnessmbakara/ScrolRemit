import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'

// Contract addresses - UPDATE THESE when deployed to Scroll
export const CONTRACTS = {
  PROFILE_REGISTRY: import.meta.env.VITE_PROFILE_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
  STREAMING_PAYMENT: import.meta.env.VITE_STREAMING_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  MOCK_USDC: import.meta.env.VITE_MOCK_USDC_ADDRESS || '0x0000000000000000000000000000000000000000',
}

// ProfileRegistry Contract ABI
export const PROFILE_REGISTRY_ABI = [
  'function setProfile(string calldata cid, string calldata username) external',
  'function getProfile(address user) external view returns (string memory)',
  'function getProfileByUsername(string calldata username) external view returns (string memory)',
  'function getUsername(address user) external view returns (string memory)',
  'function isUsernameAvailable(string calldata username) external view returns (bool)',
  'function hasProfile(address user) external view returns (bool)',
  'function usernameToAddress(string calldata username) external view returns (address)',
  'function deleteProfile() external',
  'event ProfileUpdated(address indexed user, string cid, string username, uint256 timestamp)',
]

// Streaming Payment Contract ABI (simplified for demo)
export const STREAMING_ABI = [
  'function createStream(address recipient, uint256 amount, uint256 duration) external returns (uint256)',
  'function cancelStream(uint256 streamId) external',
  'function withdrawFromStream(uint256 streamId) external returns (uint256)',
  'function getStreamBalance(uint256 streamId) external view returns (uint256)',
  'function getActiveStreams(address recipient) external view returns (uint256[])',
  'function streamInfo(uint256 streamId) external view returns (address sender, address recipient, uint256 rate, uint256 startTime, uint256 endTime, uint256 withdrawn, bool active)',
  'event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 rate, uint256 duration)',
  'event StreamWithdrawn(uint256 indexed streamId, address indexed recipient, uint256 amount)',
  'event StreamCancelled(uint256 indexed streamId)',
]

// USDC Token ABI (ERC20)
export const USDC_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]

/**
 * Get public JSON-RPC provider for read-only operations
 * @returns {ethers.JsonRpcProvider} Provider instance
 */
export function getPublicProvider() {
  const rpcUrl = import.meta.env.VITE_RPC_URL || 'https://sepolia-rpc.scroll.io/'
  return new ethers.JsonRpcProvider(rpcUrl)
}

/**
 * Get ethers provider from Privy wallet
 * @param {object} wallet - Privy wallet object from useWallets() hook
 */
export async function getProvider(wallet) {
  if (!wallet) {
    throw new Error('No Privy wallet provided')
  }
  // Get EIP-1193 provider from Privy wallet and wrap with BrowserProvider
  const ethereumProvider = await wallet.getEthereumProvider()
  const provider = new ethers.BrowserProvider(ethereumProvider)
  return provider
}

/**
 * Get ethers signer from Privy wallet  
 * @param {object} wallet - Privy wallet object from useWallets() hook
 */
export async function getSigner(wallet) {
  const provider = await getProvider(wallet)
  return provider.getSigner()
}

// Get contract instances
export function getProfileRegistryContract(signerOrProvider) {
  return new ethers.Contract(CONTRACTS.PROFILE_REGISTRY, PROFILE_REGISTRY_ABI, signerOrProvider)
}

export function getStreamingContract(signerOrProvider) {
  return new ethers.Contract(CONTRACTS.STREAMING_PAYMENT, STREAMING_ABI, signerOrProvider)
}

export function getUSDCContract(signerOrProvider) {
  return new ethers.Contract(CONTRACTS.MOCK_USDC, USDC_ABI, signerOrProvider)
}

// ============ Profile Registry Functions ============

/**
 * Set user profile CID on-chain
 * @param {string} cid - IPFS CID of profile metadata
 * @param {string} username - Unique username
 * @param {object} wallet - Privy wallet object
 * @returns {Promise<{success: boolean, txHash?: string, error?: string}>}
 */
export async function setProfileOnChain(cid, username, wallet) {
  // Check if contract is deployed
  const isContractDeployed = CONTRACTS.PROFILE_REGISTRY !== '0x0000000000000000000000000000000000000000'
  
  if (!isContractDeployed) {
    console.warn('ProfileRegistry contract not deployed. Using localStorage for development.')
    // Store in localStorage as fallback for development
    try {
      const profiles = JSON.parse(localStorage.getItem('profiles') || '{}')
      const signer = wallet ? await getSigner(wallet) : null
      const address = signer ? await signer.getAddress() : 'mock-address'
      profiles[address] = { cid, username, createdAt: Date.now() }
      localStorage.setItem('profiles', JSON.stringify(profiles))
      
      return {
        success: true,
        txHash: 'mock-tx-' + Date.now(), // Mock transaction hash
        isMock: true
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to save profile in development mode: ' + error.message
      }
    }
  }
  
  // Production path: Use smart contract
  try {
    console.log('📝 Creating profile on-chain...')
    console.log('Contract address:', CONTRACTS.PROFILE_REGISTRY)
    console.log('Username:', username)
    console.log('CID:', cid)
    
    console.log('Getting signer from wallet...')
    const signer = await getSigner(wallet)
    const address = await signer.getAddress()
    console.log('Signer address:', address)
    
    console.log('Creating contract instance...')
    const contract = getProfileRegistryContract(signer)
    
    console.log('Calling setProfile on contract...')
    const tx = await contract.setProfile(cid, username)
    console.log('Transaction sent:', tx.hash)
    console.log('Waiting for confirmation...')
    
    const receipt = await tx.wait()
    console.log('✅ Transaction confirmed!')
    
    // Update local username index for discovery
    try {
      const usernameIndex = JSON.parse(localStorage.getItem('usernameIndex') || '[]')
      // Check if already exists
      const exists = usernameIndex.some(u => u.address.toLowerCase() === address.toLowerCase())
      if (!exists) {
        usernameIndex.push({ username, address })
        localStorage.setItem('usernameIndex', JSON.stringify(usernameIndex))
      }
    } catch (e) {
      console.warn('Failed to update local username index:', e)
    }
    
    return {
      success: true,
      txHash: receipt.hash
    }
  } catch (error) {
    console.error('Error setting profile on-chain:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get user profile CID from chain
 * @param {string} address - User wallet address
 * @returns {Promise<string>} IPFS CID or empty string
 */
export async function getProfileFromChain(address) {
  const isContractDeployed = CONTRACTS.PROFILE_REGISTRY !== '0x0000000000000000000000000000000000000000'
  
  if (!isContractDeployed) {
    // Development fallback: read from localStorage
    try {
      const profiles = JSON.parse(localStorage.getItem('profiles') || '{}')
      return profiles[address]?.cid || ''
    } catch (error) {
      console.error('Error reading profile from localStorage:', error)
      return ''
    }
  }
  
  // Production path: Read from smart contract using public provider
  try {
    const provider = getPublicProvider()
    const contract = getProfileRegistryContract(provider)
    
    const cid = await contract.getProfile(address)
    return cid
  } catch (error) {
    console.error('Error getting profile from chain:', error)
    return ''
  }
}

/**
 * Get profile by username
 * @param {string} username - Username to query
 * @returns {Promise<string>} IPFS CID or empty string
 */
export async function getProfileByUsername(username) {
  try {
    const provider = getPublicProvider()
    const contract = getProfileRegistryContract(provider)
    
    const cid = await contract.getProfileByUsername(username)
    return cid
  } catch (error) {
    console.error('Error getting profile by username:', error)
    return ''
  }
}

/**
 * Check if username is available
 * @param {string} username - Username to check
 * @returns {Promise<boolean>}
 */
export async function isUsernameAvailable(username) {
  try {
    const provider = getPublicProvider()
    const contract = getProfileRegistryContract(provider)
    
    return await contract.isUsernameAvailable(username)
  } catch (error) {
    console.error('Error checking username availability:', error)
    return false
  }
}

/**
 * Get username for an address
 * @param {string} address - Address to query
 * @returns {Promise<string>} Username or empty string
 */
export async function getUsername(address) {
  const isContractDeployed = CONTRACTS.PROFILE_REGISTRY !== '0x0000000000000000000000000000000000000000'
  
  if (!isContractDeployed) {
    try {
      const profiles = JSON.parse(localStorage.getItem('profiles') || '{}')
      return profiles[address]?.username || ''
    } catch (error) {
      console.error('Error reading profile from localStorage:', error)
      return ''
    }
  }
  
  try {
    const provider = getPublicProvider()
    const contract = getProfileRegistryContract(provider)
    return await contract.getUsername(address)
  } catch (error) {
    console.error('Error getting username:', error)
    return ''
  }
}

/**
 * Check if an address has a profile
 * @param {string} address - Address to check
 * @returns {Promise<boolean>}
 */
export async function hasProfile(address) {
  const isContractDeployed = CONTRACTS.PROFILE_REGISTRY !== '0x0000000000000000000000000000000000000000'
  
  if (!isContractDeployed) {
    // Development fallback: check localStorage
    try {
      const profiles = JSON.parse(localStorage.getItem('profiles') || '{}')
      return !!profiles[address]
    } catch (error) {
      console.error('Error checking profile in localStorage:', error)
      return false
    }
  }
  
  try {
    const provider = getPublicProvider()
    const contract = getProfileRegistryContract(provider)
    
    return await contract.hasProfile(address)
  } catch (error) {
    console.error('Error checking if address has profile:', error)
    return false
  }
}

/**
 * Get address for a username
 * @param {string} username - Username to resolve (with or without @ prefix)
 * @returns {Promise<string>} Address or empty string if not found
 */
export async function getUsernameAddress(username) {
  // Strip @ prefix if present
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username
  
  const isContractDeployed = CONTRACTS.PROFILE_REGISTRY !== '0x0000000000000000000000000000000000000000'
  
  if (!isContractDeployed) {
    // Development fallback: search localStorage
    try {
      const profiles = JSON.parse(localStorage.getItem('profiles') || '{}')
      for (const [address, profile] of Object.entries(profiles)) {
        if (profile.username === cleanUsername) {
          return address
        }
      }
      return ''
    } catch (error) {
      console.error('Error getting username address from localStorage:', error)
      return ''
    }
  }
  
  // Production: Use contract
  try {
    const provider = getPublicProvider()
    const contract = getProfileRegistryContract(provider)
    
    // Get CID for username (this also validates username exists)
    const cid = await contract.getProfileByUsername(cleanUsername)
    if (!cid || cid === '') {
      return ''
    }
    
    // Get address from username -> address mapping
    const address = await contract.usernameToAddress(cleanUsername)
    
    // Check for zero address (if username doesn't exist)
    if (address === ethers.ZeroAddress || address === '0x0000000000000000000000000000000000000000') {
      return ''
    }
    
    return address || ''
  } catch (error) {
    console.error('Error getting address for username:', error)
    return ''
  }
}

/**
 * Get list of all known usernames (for autocomplete)
 * @returns {Promise<Array<{username: string, address: string}>>}
 */
export async function getAllUsernames() {
  const isContractDeployed = CONTRACTS.PROFILE_REGISTRY !== '0x0000000000000000000000000000000000000000'
  
  if (!isContractDeployed) {
    // Development fallback: read from localStorage
    try {
      const profiles = JSON.parse(localStorage.getItem('profiles') || '{}')
      const usernames = []
      for (const [address, profile] of Object.entries(profiles)) {
        if (profile.username) {
          usernames.push({
            username: profile.username,
            address: address
          })
        }
      }
      return usernames
    } catch (error) {
      console.error('Error getting usernames from localStorage:', error)
      return []
    }
  }
  
  // Production: Return usernames from localStorage index
  // (Updated when profiles are created)
  try {
    const usernameIndex = JSON.parse(localStorage.getItem('usernameIndex') || '[]')
    return usernameIndex
  } catch (error) {
    console.error('Error getting username index:', error)
    return []
  }
}

/**
 * Validate recipient input (address or username)
 * @param {string} input - User input
 * @returns {Promise<{valid: boolean, type: 'address'|'username'|'unknown', address: string, error?: string}>}
 */
export async function validateRecipient(input) {
  if (!input || input.trim() === '') {
    return { valid: false, type: 'unknown', address: '', error: 'Recipient is required' }
  }
  
  const trimmed = input.trim()
  
  // Check if it's an Ethereum address
  if (trimmed.startsWith('0x')) {
    try {
      // Validate address format
      const address = ethers.getAddress(trimmed) // Throws if invalid
      return { valid: true, type: 'address', address }
    } catch (error) {
      return { valid: false, type: 'unknown', address: '', error: 'Invalid Ethereum address' }
    }
  }
  
  // Assume it's a username
  const cleanUsername = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed
  
  // Validate username format (alphanumeric, hyphens, underscores)
  const usernameRegex = /^[a-z0-9_-]+$/i
  if (!usernameRegex.test(cleanUsername)) {
    return { valid: false, type: 'unknown', address: '', error: 'Invalid username format' }
  }
  
  // Try to resolve username to address
  const address = await getUsernameAddress(cleanUsername)
  
  if (address && address !== '') {
    return { valid: true, type: 'username', address }
  } else {
    return { valid: false, type: 'username', address: '', error: `Username '@${cleanUsername}' not found` }
  }
}

// ============ Streaming Payment Functions ============

// Create a new payment stream
export async function createStream(signer, recipient, amountUSDC, durationDays) {
  try {
    const streamingContract = getStreamingContract(signer)
    const usdcContract = getUSDCContract(signer)
    
    // Convert USDC amount to wei (6 decimals for USDC)
    const amount = ethers.parseUnits(amountUSDC.toString(), 6)
    const duration = durationDays * 24 * 60 * 60 // Convert days to seconds
    
    // Check allowance
    const currentAllowance = await usdcContract.allowance(
      await signer.getAddress(),
      CONTRACTS.STREAMING_PAYMENT
    )
    
    // Approve if needed
    if (currentAllowance < amount) {
      const approveTx = await usdcContract.approve(CONTRACTS.STREAMING_PAYMENT, amount)
      await approveTx.wait()
    }
    
    // Create stream
    const tx = await streamingContract.createStream(recipient, amount, duration)
    const receipt = await tx.wait()
    
    // Extract streamId from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = streamingContract.interface.parseLog(log)
        return parsed.name === 'StreamCreated'
      } catch {
        return false
      }
    })
    
    const parsed = streamingContract.interface.parseLog(event)
    return {
      success: true,
      streamId: parsed.args.streamId.toString(),
      txHash: receipt.hash
    }
  } catch (error) {
    console.error('Error creating stream:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Send instant payment (one-time transfer)
export async function sendInstantPayment(signer, recipient, amountUSDC) {
  try {
    const usdcContract = getUSDCContract(signer)
    const amount = ethers.parseUnits(amountUSDC.toString(), 6)
    
    const tx = await usdcContract.transfer(recipient, amount)
    const receipt = await tx.wait()
    
    return {
      success: true,
      txHash: receipt.hash
    }
  } catch (error) {
    console.error('Error sending payment:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Withdraw from a stream
export async function withdrawFromStream(signer, streamId) {
  try {
    const streamingContract = getStreamingContract(signer)
    
    const tx = await streamingContract.withdrawFromStream(streamId)
    const receipt = await tx.wait()
    
    // Extract withdrawn amount from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = streamingContract.interface.parseLog(log)
        return parsed.name === 'StreamWithdrawn'
      } catch {
        return false
      }
    })
    
    const parsed = streamingContract.interface.parseLog(event)
    const amount = ethers.formatUnits(parsed.args.amount, 6)
    
    return {
      success: true,
      amount,
      txHash: receipt.hash
    }
  } catch (error) {
    console.error('Error withdrawing from stream:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Get current streamable balance for a stream
export async function getStreamBalance(provider, streamId) {
  try {
    const streamingContract = getStreamingContract(provider)
    const balance = await streamingContract.getStreamBalance(streamId)
    return ethers.formatUnits(balance, 6)
  } catch (error) {
    console.error('Error getting stream balance:', error)
    return '0'
  }
}

// Get all active streams for an address
export async function getActiveStreams(provider, address) {
  try {
    const streamingContract = getStreamingContract(provider)
    const streamIds = await streamingContract.getActiveStreams(address)
    
    // Fetch info for each stream
    const streams = await Promise.all(
      streamIds.map(async (id) => {
        const info = await streamingContract.streamInfo(id)
        return {
          id: id.toString(),
          sender: info.sender,
          recipient: info.recipient,
          rate: ethers.formatUnits(info.rate, 6),
          startTime: Number(info.startTime),
          endTime: Number(info.endTime),
          withdrawn: ethers.formatUnits(info.withdrawn, 6),
          active: info.active
        }
      })
    )
    
    return streams
  } catch (error) {
    console.error('Error getting active streams:', error)
    return []
  }
}

// Calculate total streamable balance across all streams
export async function getTotalStreamableBalance(provider, address) {
  try {
    const streams = await getActiveStreams(provider, address)
    let total = 0
    
    for (const stream of streams) {
      const balance = await getStreamBalance(provider, stream.id)
      total += parseFloat(balance)
    }
    
    return total.toFixed(6)
  } catch (error) {
    console.error('Error calculating total balance:', error)
    return '0'
  }
}

/**
 * Get distinct number of supporters (unique senders of streams or USDC)
 * @param {string} address - Profile address to check
 * @returns {Promise<number>} Number of unique supporters
 */
export async function getSupporterCount(address) {
  if (!address) return 0
  
  try {
    const provider = getPublicProvider()
    const usdcContract = getUSDCContract(provider)
    const streamingContract = getStreamingContract(provider)
    
    // 1. Get Instant Payment Supporters (USDC Transfers)
    // Filter: Transfer(from, to, value) -> topic2 is 'to'
    const transferFilter = usdcContract.filters.Transfer(null, address)
    const transferEvents = await usdcContract.queryFilter(transferFilter, -10000) // Look back 10k blocks for speed
    
    const transferSenders = transferEvents.map(e => e.args[0])
    
    // 2. Get Streaming Supporters
    // Filter: StreamCreated(id, sender, recipient, ...) -> topic3 is 'recipient'
    const streamFilter = streamingContract.filters.StreamCreated(null, null, address)
    const streamEvents = await streamingContract.queryFilter(streamFilter, -10000)
    
    const streamSenders = streamEvents.map(e => e.args[1])
    
    // 3. Aggregate Unique Senders
    const allSenders = [...transferSenders, ...streamSenders]
    const uniqueSenders = new Set(allSenders.map(s => s.toLowerCase()))
    
    // Exclude self (if user sent to themselves for testing)
    uniqueSenders.delete(address.toLowerCase())
    
    return uniqueSenders.size
  } catch (error) {
    console.error(`Error getting supporters for ${address}:`, error)
    return 0
  }
}
