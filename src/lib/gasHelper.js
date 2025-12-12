import { ethers } from 'ethers'

const MIN_GAS_BALANCE = ethers.parseEther('0.0005') // Minimum balance needed for gas

/**
 * Check if wallet has sufficient gas for transactions
 * @param {string} address - Wallet address to check
 * @param {object} provider - Ethers provider
 * @returns {Promise<{hasGas: boolean, balance: string}>}
 */
export async function checkGasBalance(address, provider) {
  try {
    const balance = await provider.getBalance(address)
    return {
      hasGas: balance >= MIN_GAS_BALANCE,
      balance: ethers.formatEther(balance),
      balanceWei: balance
    }
  } catch (error) {
    console.error('Error checking gas balance:', error)
    return {
      hasGas: false,
      balance: '0',
      balanceWei: 0n
    }
  }
}

/**
 * Request gas funding from backend API
 * @param {string} address - Wallet address to fund
 * @returns {Promise<{success: boolean, message?: string, txHash?: string}>}
 */
export async function requestGasFunding(address) {
  try {
    // Use relative path for API endpoint (works in both dev and prod)
    const apiUrl = '/api/fund-wallet'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Funding request failed')
    }

    return {
      success: true,
      ...data
    }
  } catch (error) {
    console.error('Error requesting gas funding:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * Estimate gas cost for profile creation (rough estimate)
 * @returns {string} Estimated gas cost in ETH
 */
export function estimateGasForProfile() {
  // Profile creation typically costs ~0.0001 - 0.0002 ETH
  return '0.0002'
}

/**
 * Auto-fund wallet if needed, with user-friendly messages
 * @param {string} address - Wallet address
 * @param {object} provider - Ethers provider  
 * @param {function} onStatusUpdate - Callback for status updates
 * @returns {Promise<boolean>} true if wallet is ready (funded or already has gas)
 */
export async function ensureGasBalance(address, provider, onStatusUpdate) {
  try {
    onStatusUpdate?.('Checking wallet balance...')
    
    const { hasGas } = await checkGasBalance(address, provider)
    
    if (hasGas) {
      return true
    }

    // Need to fund
    onStatusUpdate?.('⏳ Preparing your wallet for the blockchain...')
    
    const result = await requestGasFunding(address)
    
    if (result.success) {
      onStatusUpdate?.('✅ Wallet funded! Proceeding...')
      // Wait a moment for balance to update
      await new Promise(resolve => setTimeout(resolve, 2000))
      return true
    } else {
      throw new Error(result.message || 'Failed to fund wallet')
    }
  } catch (error) {
    console.error('Error ensuring gas balance:', error)
    onStatusUpdate?.(`❌ ${error.message}`)
    return false
  }
}
