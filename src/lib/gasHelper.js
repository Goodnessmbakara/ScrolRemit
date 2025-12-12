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
    
    console.log('🌐 [API] Calling funding endpoint:', apiUrl)
    console.log('📤 [API] Request payload:', { address })
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address })
    })

    console.log('📥 [API] Response status:', response.status, response.statusText)
    
    const data = await response.json()
    console.log('📦 [API] Response data:', data)

    if (!response.ok) {
      const errorMsg = data.message || data.error || 'Funding request failed'
      console.error('❌ [API] Request failed:', errorMsg)
      throw new Error(errorMsg)
    }

    return {
      success: true,
      ...data
    }
  } catch (error) {
    console.error('💥 [API] Error requesting gas funding:', error)
    console.error('   Network error?', error.name === 'TypeError')
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
    console.log('🔍 [GAS CHECK] Starting gas balance check for:', address)
    onStatusUpdate?.('Checking wallet balance...')
    
    const { hasGas, balance } = await checkGasBalance(address, provider)
    console.log('💰 [GAS CHECK] Current balance:', balance, 'ETH | Has sufficient gas:', hasGas)
    
    if (hasGas) {
      console.log('✅ [GAS CHECK] Wallet has sufficient gas, skipping funding')
      return true
    }

    // Need to fund
    console.log('⚠️ [GAS CHECK] Insufficient gas, requesting funding...')
    onStatusUpdate?.('⏳ Preparing your wallet for the blockchain...')
    
    const result = await requestGasFunding(address)
    console.log('📡 [GAS FUNDING] API response:', result)
    
    if (result.success) {
      console.log('✅ [GAS FUNDING] Wallet funded successfully!')
      console.log('   TX Hash:', result.txHash)
      console.log('   Amount:', result.amount, 'ETH')
      console.log('   New Balance:', result.newBalance, 'ETH')
      
      onStatusUpdate?.('✅ Wallet funded! Proceeding...')
      // Wait for balance to update
      console.log('⏳ [GAS FUNDING] Waiting 5 seconds for balance to propagate...')
      await new Promise(resolve => setTimeout(resolve, 5000))
      return true
    } else {
      console.error('❌ [GAS FUNDING] Funding failed:', result.message)
      throw new Error(result.message || 'Failed to fund wallet')
    }
  } catch (error) {
    console.error('💥 [GAS CHECK] Error in ensureGasBalance:', error)
    console.error('   Error message:', error.message)
    console.error('   Error stack:', error.stack)
    onStatusUpdate?.(`❌ ${error.message}`)
    return false
  }
}
