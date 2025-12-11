# Auto-Funding User Wallets for Profile Creation

## Problem
Users need **Scroll Sepolia ETH** to pay for gas when creating profiles on-chain. New users won't have any ETH in their wallets.

## Solution
Auto-fund user wallets with a small amount of Scroll Sepolia ETH from your admin wallet.

---

## Token Required
**Scroll Sepolia ETH** - The native token on Scroll Sepolia testnet for gas fees.

---

## How It Works

### Auto-Funding Script
Created `fundWallet.js` to automatically send ETH to users who need it:

- **Checks** user wallet balance
- **Funds** with 0.005 ETH if balance < 0.001 ETH
- **Admin wallet** pays for the transfer

### Usage

**Fund a specific user:**
```bash
cd blockchain
node scripts/fundWallet.js 0xUserWalletAddress
```

**Example:**
```bash
node scripts/fundWallet.js 0x40a2Aa83271dd2F86e7C50C05b60bf3873bA4461
```

---

## Setup

### 1. Configure Admin Wallet

The admin wallet is already configured in `/blockchain/.env`:
```
ADMIN_FUNDING_PRIVATE_KEY=your_private_key_here
```

Currently using the same wallet as deployer (has ~0.019 ETH).

### 2. Ensure Admin Wallet Has ETH

Check balance:
```bash
# Your admin wallet: 0x40a2Aa83271dd2F86e7C50C05b60bf3873bA4461
# Current balance: ~0.019 ETH
```

Get more from faucet if needed:
https://sepolia.scroll.io/faucet

---

## Integration Options

### Option 1: Backend API (Recommended for Production)

Create a backend endpoint that:
1. User signs up with Privy
2. Frontend calls `/api/fund-wallet` with user address
3. Backend runs `checkAndFundWallet(userAddress)`
4. User can now create profile

### Option 2: Manual Funding

When user gets "insufficient funds" error:
1. Copy their wallet address from error/console
2. Run: `node scripts/fundWallet.js <address>`
3. Ask user to retry profile creation

### Option 3: Privy Gas Sponsorship (Best UX)

Enable gas sponsorship in Privy dashboard:
- Go to https://dashboard.privy.io
- Navigate to your app
- Enable "Gas Sponsorship" for Scroll Sepolia
- All transactions become gas-free for users!

---

## Cost Analysis

### Per User Funding
- Amount per user: **0.005 ETH** (~$0.01 USD at current prices)
- Profile creation gas: **~0.0001 ETH**
- User gets: **50 profile creations** worth of gas

### With 100 Users
- Total needed: **0.5 ETH** for 100 users
- Current balance: **0.019 ETH** (can fund ~3-4 users)

**Recommendation:** Get more testnet ETH from faucet or use Privy gas sponsorship for production.

---

## Testing

1. **Check user wallet balance:**
   Open browser console after sign-in, you'll see:
   ```
   Signer address: 0x...
   Wallet balance: 0.0 ETH
   ```

2. **Fund the wallet:**
   ```bash
   node scripts/fundWallet.js 0x...
   ```

3. **Verify funding:**
   Check console - should show new balance

4. **Create profile:**
   Try again - should succeed!

---

## Production Recommendations

1. **Use Privy Gas Sponsorship** - Best UX, no manual intervention
2. **Or implement backend API** for auto-funding
3. **Monitor admin wallet balance** - Set up alerts
4. **Use dedicated funding wallet** - Separate from deployer for security
5. **Mainnet**: Use real ETH, calculate costs carefully

---

## Current Status

✅ Script created
✅ Admin wallet configured  
✅ localStorage removed
⏳ Need to fund admin wallet with more ETH
⏳ Implement backend API (optional)
⏳ Or enable Privy gas sponsorship
