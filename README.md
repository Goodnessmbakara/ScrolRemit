# ScrolRemit

Premium fintech platform on Scroll network merging P2P remittance with creator patronage. Features real-time streaming payments and on-chain creator profiles.

## 🚀 Deployed on Scroll Sepolia

### Smart Contracts

All contracts deployed and verified on Scroll Sepolia testnet:

| Contract | Address | Scrollscan |
|----------|---------|------------|
| **ProfileRegistry** | `0x7CCD52ACcB065c63D7Df21d57ECD97CB4A157374` | [View](https://sepolia.scrollscan.com/address/0x7CCD52ACcB065c63D7Df21d57ECD97CB4A157374) |
| **MockUSDC** | `0x775b594496D7365C5Be22B8bd5Cd6188a995c1d9` | [View](https://sepolia.scrollscan.com/address/0x775b594496D7365C5Be22B8bd5Cd6188a995c1d9) |
| **StreamingPayment** | `0xDdc49E1bA14E64c824B7eDF8924572618fe100AF` | [View](https://sepolia.scrollscan.com/address/0xDdc49E1bA14E64c824B7eDF8924572618fe100AF) |

## ✨ Key Features

- ⭐ **Real-Time Streaming**: Watch balance increase second-by-second
- 💸 **Dual Payments**: Instant send or stream over time
- 👤 **Creator Profiles**: IPFS-backed on-chain profiles with username registration
- 🪙 **Test Tokens**: Integrated faucet - mint 1000 mUSDC every 24 hours
- 🔐 **Privy Auth**: Seamless embedded wallet integration
- 🔗 **Scroll Network**: Fast, low-cost transactions on Scroll Sepolia

## 🏁 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Scroll Sepolia ETH (for gas) - Get from [faucet](https://sepolia.scroll.io/faucet)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Privy App ID

# Start development server
npm run dev
```

Visit `http://localhost:5173`

### Get Test Tokens

1. **Sign in** with Privy (email-based)
2. **Mint mUSDC**: Run `cd blockchain && node scripts/mintUSDC.js`
3. Or call `mint()` on MockUSDC contract directly

## 🎨 Design System

**Premium Utility Aesthetic**
- 3-Color Palette: White (#FFFFFF) • Black (#000000) • Klein Blue (#002FA7)
- Flat colors, no gradients
- Clean typography with Inter font
- Glassmorphism effects on key components

## 📁 Project Structure

```
ScrolRemit/
├── src/
│   ├── components/     # Reusable UI (Button, Input, Card, Navbar)
│   ├── pages/          # Landing, Dashboard, Send, Profile
│   ├── lib/            # Web3 integration, contracts, IPFS
│   ├── hooks/          # Custom React hooks
│   └── context/        # Wallet context
├── blockchain/
│   ├── contracts/      # Solidity smart contracts
│   └── scripts/        # Deployment & utility scripts
└── public/             # Static assets
```

## 🔧 Configuration

### Environment Variables

Required in root `.env`:

```bash
# Privy Authentication
VITE_PRIVY_APP_ID=your_privy_app_id

# Pinata IPFS (for profile images)
VITE_PINATA_JWT=your_pinata_jwt
VITE_PINATA_GATEWAY=your_gateway

# Deployed Contracts (already configured)
VITE_PROFILE_REGISTRY_ADDRESS=0x7CCD52ACcB065c63D7Df21d57ECD97CB4A157374
VITE_MOCK_USDC_ADDRESS=0x775b594496D7365C5Be22B8bd5Cd6188a995c1d9
VITE_STREAMING_CONTRACT_ADDRESS=0xDdc49E1bA14E64c824B7eDF8924572618fe100AF
```

## 🛠 Tech Stack

- **Frontend**: Vite + React 19
- **Wallet**: Privy (embedded wallets)
- **Blockchain**: Scroll Sepolia (L2)
- **Web3**: ethers.js v6
- **Storage**: Pinata (IPFS)
- **Routing**: React Router DOM v7
- **Contracts**: Solidity 0.8.20 + OpenZeppelin

## 📜 Smart Contract Features

### ProfileRegistry
- On-chain profile storage with IPFS CIDs
- Username registration (unique & permanent)
- Profile lookup by address or username

### MockUSDC (mUSDC)
- ERC20 token with 6 decimals
- Public faucet: 1000 mUSDC/day/address
- Rate-limited for fair distribution

### StreamingPayment
- Create continuous payment streams
- Time-based token accrual
- Cancel & withdraw functionality
- ReentrancyGuard + SafeERC20

## 🧪 Development Scripts

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Production build

# Blockchain (in /blockchain directory)
node scripts/mintUSDC.js       # Mint test USDC
node scripts/deployAll.js      # Deploy all contracts
node scripts/verify.js         # Verify on Scrollscan
```

## 🤝 Contributing

This is a hackathon/demo project. Feel free to fork and experiment!

## 📄 License

MIT

---

**Built on Scroll Network** 🌀
