// Simple auto-funding API endpoint
// Deploy this to Vercel, Netlify, or any serverless platform

import { ethers } from 'ethers';

const SCROLL_RPC = 'https://sepolia-rpc.scroll.io/';
const MIN_BALANCE = ethers.parseEther('0.0005');
const FUND_AMOUNT = ethers.parseEther('0.002');

// Store funded addresses to prevent abuse (in production, use a database)
const fundedAddresses = new Set();
const COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours
const lastFunded = new Map();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.body;

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    // Check cooldown
    const lastTime = lastFunded.get(address);
    if (lastTime && Date.now() - lastTime < COOLDOWN) {
      return res.status(429).json({ 
        error: 'Too many requests',
        message: 'You can request funding once every 24 hours'
      });
    }

    // Check balance
    const provider = new ethers.JsonRpcProvider(SCROLL_RPC);
    const balance = await provider.getBalance(address);

    if (balance >= MIN_BALANCE) {
      return res.status(200).json({
        success: false,
        message: 'Wallet already has sufficient balance',
        balance: ethers.formatEther(balance)
      });
    }

    // Fund the wallet
    const adminPrivateKey = process.env.ADMIN_FUNDING_PRIVATE_KEY;
    if (!adminPrivateKey) {
      throw new Error('Admin wallet not configured');
    }

    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    const tx = await adminWallet.sendTransaction({
      to: address,
      value: FUND_AMOUNT
    });

    await tx.wait();

    // Update cooldown
    lastFunded.set(address, Date.now());

    const newBalance = await provider.getBalance(address);

    return res.status(200).json({
      success: true,
      message: 'Wallet funded successfully',
      txHash: tx.hash,
      amount: ethers.formatEther(FUND_AMOUNT),
      newBalance: ethers.formatEther(newBalance)
    });

  } catch (error) {
    console.error('Funding error:', error);
    return res.status(500).json({
      error: 'Funding failed',
      message: error.message
    });
  }
}
