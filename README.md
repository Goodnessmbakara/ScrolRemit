# ScrolRemit

Premium fintech platform on Scroll network merging P2P remittance with creator patronage. Features real-time streaming payments.

## Key Features

- ⭐ **Real-Time Ticking Balance**: Watch funds increase second-by-second
- 💸 **Dual Payments**: Instant send or stream over time
- 👤 **Creator Profiles**: IPFS-backed shareable pages
- 🔗 **Scroll Integration**: Sepolia testnet support with MetaMask

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

## Design System

**3-Color Palette**: White (#FFFFFF) • Black (#000000) • Klein Blue (#002FA7)

No gradients or shadows - flat colors only. Premium Utility aesthetic.

## Project Structure

```
src/
├── components/     # Button, Input, Card, TickingBalance, Navbar
├── pages/          # Landing, Dashboard, Send, CreateProfile, PublicProfile
├── lib/            # web3.js, contracts.js, pinata.js
├── hooks/          # useBalance.js
└── context/        # WalletContext.jsx
```

## Smart Contract Integration

Update addresses in `src/lib/contracts.js` after deployment:

```javascript
export const CONTRACTS = {
  STREAMING_PAYMENT: '0x...',
  USDC: '0x...',
}
```

## Environment Variables

```bash
VITE_PINATA_JWT=your_jwt_token  # For creator profile storage
```

## Tech Stack

- Vite + React
- ethers.js v6
- Scroll Sepolia
- Pinata (IPFS)
- React Router DOM

Built on Scroll Network
