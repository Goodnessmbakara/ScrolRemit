import { useState, useEffect } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { ethers } from 'ethers'

/**
 * Hook to automatically fund new wallets on signup
 * @returns {Object} { isFunding, fundingError, requestFunding }
 */
export function useAutoFundWallet() {
  const { wallets } = useWallets()
  const [isFunding, setIsFunding] = useState(false)
  const [fundingError, setFundingError] = useState(null)
  const [alreadyChecked, setAlreadyChecked] = useState(false)

  const wallet = wallets[0]
  const address = wallet?.address

  useEffect(() => {
    async function checkAndFund() {
      if (!address || alreadyChecked) return

      try {
        // Check balance
        const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io/')
        const balance = await provider.getBalance(address)
        
        console.log('Wallet balance:', ethers.formatEther(balance), 'ETH')

        // If balance is too low, request funding
        if (balance < ethers.parseEther('0.0005')) {
          console.log('⚠️ Low balance detected, requesting auto-funding...')
          await requestFunding(address)
        }

        setAlreadyChecked(true)
      } catch (error) {
        console.error('Error checking balance:', error)
      }
    }

    checkAndFund()
  }, [address, alreadyChecked])

  const requestFunding = async (addr = address) => {
    if (!addr) {
      setFundingError('No wallet address')
      return { success: false, error: 'No wallet address' }
    }

    setIsFunding(true)
    setFundingError(null)

    try {
      // Call your funding API endpoint
      // For development, you can use the local script
      const response = await fetch('/api/fund-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Funding failed')
      }

      console.log('✅ Wallet funded:', data)
      return { success: true, data }

    } catch (error) {
      console.error('Funding error:', error)
      setFundingError(error.message)
      return { success: false, error: error.message }
    } finally {
      setIsFunding(false)
    }
  }

  return {
    isFunding,
    fundingError,
    requestFunding
  }
}
