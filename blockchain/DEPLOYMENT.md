# Smart Contract Deployment Guide

## Prerequisites

You need a wallet with Scroll Sepolia ETH to deploy contracts.

### Get Scroll Sepolia ETH:
1. Visit the Scroll Sepolia Faucet: https://sepolia.scroll.io/faucet
2. Connect your wallet
3. Request testnet ETH

## Deployment Steps

### 1. Set Your Private Key

Create or update `/blockchain/.env`:

```bash
cd /Users/abba/Desktop/ScrolRemit/blockchain
echo "DEPLOYER_PRIVATE_KEY=your_private_key_here" > .env
```

> ⚠️ **NEVER commit your private key** - `.env` should be in `.gitignore`

### 2. Install Dependencies (if needed)

```bash
cd /Users/abba/Desktop/ScrolRemit/blockchain
npm install
```

### 3. Deploy ProfileRegistry

```bash
npx hardhat ignition deploy ./ignition/modules/ProfileRegistry.js --network scrollSepolia
```

### 4. Copy Contract Address

After deployment, you'll see output like:
```
ProfileRegistryModule#ProfileRegistry - 0x1234...5678
```

### 5. Update Frontend Environment

Copy the deployed address to `/Users/abba/Desktop/ScrolRemit/.env`:

```bash
VITE_PROFILE_REGISTRY_ADDRESS=0x1234...5678
```

### 6. Restart Dev Server

```bash
# In the main project directory
pnpm dev
```

## Verification (Optional)

To verify the contract on Scrollscan:

```bash
npx hardhat verify --network scrollSepolia <CONTRACT_ADDRESS>
```

## Testing

After deployment:
1. Sign in to the app with Privy
2. Navigate to Profile page
3. Create a profile
4. Should see success message with transaction hash
5. Profile should persist after reload
6. No MetaMask popup should appear!
