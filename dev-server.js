// Development API server to handle /api routes locally
// This runs alongside Vite during development
import express from 'express'
import cors from 'cors'
import { ethers } from 'ethers'
import 'dotenv/config'

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())

// Scroll Sepolia configuration
const SCROLL_RPC = 'https://sepolia-rpc.scroll.io/'
const MIN_BALANCE = ethers.parseEther('0.0005')
const FUND_AMOUNT = ethers.parseEther('0.002')

// Simple in-memory store (reset on server restart)
const lastFunded = new Map()
const COOLDOWN = 24 * 60 * 60 * 1000 // 24 hours

// Fund wallet endpoint (matches /api/fund-wallet.js)
app.post('/api/fund-wallet', async (req, res) => {
  try {
    const { address } = req.body

    console.log('📥 [DEV API] Funding request for:', address)

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' })
    }

    // Check cooldown
    const lastTime = lastFunded.get(address)
    if (lastTime && Date.now() - lastTime < COOLDOWN) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'You can request funding once every 24 hours'
      })
    }

    // Check balance
    const provider = new ethers.JsonRpcProvider(SCROLL_RPC)
    const balance = await provider.getBalance(address)

    console.log('💰 [DEV API] Current balance:', ethers.formatEther(balance), 'ETH')

    if (balance >= MIN_BALANCE) {
      return res.status(200).json({
        success: false,
        message: 'Wallet already has sufficient balance',
        balance: ethers.formatEther(balance)
      })
    }

    // Fund the wallet
    const adminPrivateKey = process.env.ADMIN_FUNDING_PRIVATE_KEY
    if (!adminPrivateKey) {
      console.error('❌ [DEV API] ADMIN_FUNDING_PRIVATE_KEY not found in .env')
      throw new Error('Admin wallet not configured')
    }

    console.log('💸 [DEV API] Funding wallet with', ethers.formatEther(FUND_AMOUNT), 'ETH...')

    const adminWallet = new ethers.Wallet(adminPrivateKey, provider)
    const tx = await adminWallet.sendTransaction({
      to: address,
      value: FUND_AMOUNT
    })

    console.log('⏳ [DEV API] Transaction sent:', tx.hash)
    console.log('⏳ [DEV API] Waiting for confirmation...')

    await tx.wait()

    // Update cooldown
    lastFunded.set(address, Date.now())

    const newBalance = await provider.getBalance(address)

    console.log('✅ [DEV API] Funding successful!')
    console.log('   New balance:', ethers.formatEther(newBalance), 'ETH')
    console.log('   TX Hash:', tx.hash)

    return res.status(200).json({
      success: true,
      message: 'Wallet funded successfully',
      txHash: tx.hash,
      amount: ethers.formatEther(FUND_AMOUNT),
      newBalance: ethers.formatEther(newBalance)
    })

  } catch (error) {
    console.error('❌ [DEV API] Funding error:', error)
    return res.status(500).json({
      error: 'Funding failed',
      message: error.message
    })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Development API server is running',
    adminWallet: process.env.ADMIN_FUNDING_PRIVATE_KEY ? 'configured' : 'missing'
  })
})

// Start server
app.listen(PORT, () => {
  console.log('🚀 Development API Server Started')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   Running on: http://localhost:${PORT}`)
  console.log(`   API Endpoint: http://localhost:${PORT}/api/fund-wallet`)
  console.log(`   Health Check: http://localhost:${PORT}/api/health`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('💡 Make sure Vite is running on port 5173')
  console.log('   Run: pnpm dev')
  console.log('')
})
