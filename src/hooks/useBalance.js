import { useState, useEffect } from 'react'
import { getActiveStreams, getStreamBalance } from '../lib/contracts'

/**
 * Custom hook for real-time balance calculation
 * Simulates second-by-second streaming when contracts aren't deployed
 * Switches to actual blockchain data when contracts are available
 */
export function useStreamingBalance(provider, address, useBlockchain = false) {
  const [balance, setBalance] = useState(0)
  const [streams, setStreams] = useState([])
  const [totalRate, setTotalRate] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch active streams
  useEffect(() => {
    if (!provider || !address) {
      setIsLoading(false)
      return
    }

    async function fetchStreams() {
      try {
        if (useBlockchain) {
          // Fetch from blockchain
          const activeStreams = await getActiveStreams(provider, address)
          setStreams(activeStreams)
          
          // Calculate total rate
          const rate = activeStreams.reduce((sum, stream) => {
            return sum + parseFloat(stream.rate)
          }, 0)
          setTotalRate(rate)
          
          // Calculate current balance
          let total = 0
          for (const stream of activeStreams) {
            const streamBalance = await getStreamBalance(provider, stream.id)
            total += parseFloat(streamBalance)
          }
          setBalance(total)
        } else {
          // Mock data for development
          const mockStreams = [
            { id: '1', sender: '0x1234...5678', rate: 0.01, startTime: Date.now() - 3600000 },
            { id: '2', sender: '0x8765...4321', rate: 0.005, startTime: Date.now() - 7200000 },
          ]
          setStreams(mockStreams)
          setTotalRate(0.015)
          setBalance(125.50)
        }
      } catch (error) {
        console.error('Error fetching streams:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStreams()
    
    // Refresh every 30 seconds if using blockchain
    if (useBlockchain) {
      const interval = setInterval(fetchStreams, 30000)
      return () => clearInterval(interval)
    }
  }, [provider, address, useBlockchain])

  // Update balance every second (simulation)
  useEffect(() => {
    if (totalRate === 0 || isLoading) return

    const interval = setInterval(() => {
      setBalance(prev => prev + totalRate)
    }, 1000)

    return () => clearInterval(interval)
  }, [totalRate, isLoading])

  return {
    balance,
    streams,
    totalRate,
    isLoading,
    isStreaming: streams.length > 0
  }
}

/**
 * Hook to track transaction status
 */
export function useTransaction() {
  const [status, setStatus] = useState('idle') // idle, pending, success, error
  const [txHash, setTxHash] = useState(null)
  const [error, setError] = useState(null)

  const reset = () => {
    setStatus('idle')
    setTxHash(null)
    setError(null)
  }

  const startTransaction = () => {
    setStatus('pending')
    setError(null)
  }

  const completeTransaction = (hash) => {
    setStatus('success')
    setTxHash(hash)
  }

  const failTransaction = (err) => {
    setStatus('error')
    setError(err)
  }

  return {
    status,
    txHash,
    error,
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
    startTransaction,
    completeTransaction,
    failTransaction,
    reset
  }
}
