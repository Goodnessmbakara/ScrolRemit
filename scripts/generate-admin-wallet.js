#!/usr/bin/env node
/**
 * Generate a new Ethereum v for auto-funding on Scroll Sepolia
 * This script creates a fresh wallet and displays the address and private key
 * 
 * Usage: node scripts/generate-admin-wallet.js
 */

import { ethers } from 'ethers';

console.log('🔑 Generating Admin Funding Wallet for Scroll Sepolia\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const wallet = ethers.Wallet.createRandom();

console.log('\n✅ New Wallet Generated!\n');
console.log('📋 Wallet Details:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Address:     ${wallet.address}`);
console.log(`Private Key: ${wallet.privateKey}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📝 Next Steps:\n');
console.log('1. Add this private key to your .env file:');
console.log(`   ADMIN_FUNDING_PRIVATE_KEY=${wallet.privateKey}\n`);
console.log('2. Add to Vercel environment variables:');
console.log('   - Go to Vercel Dashboard → Settings → Environment Variables');
console.log(`   - Add: ADMIN_FUNDING_PRIVATE_KEY = ${wallet.privateKey}\n`);
console.log('3. Fund this wallet with Scroll Sepolia ETH:');
console.log('   - Visit: https://sepolia.scroll.io/faucet');
console.log(`   - Enter address: ${wallet.address}`);
console.log('   - Request test ETH (you\'ll need at least 0.1 ETH)\n');
console.log('⚠️  SECURITY WARNING:');
console.log('   - Never commit this private key to Git');
console.log('   - Keep it secure and backed up');
console.log('   - Use this wallet ONLY for auto-funding on testnet');
console.log('   - For production, use a more secure key management system\n');
