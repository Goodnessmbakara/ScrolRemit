import '@privy-io/react-auth/styles.css'
import { PrivyProvider } from '@privy-io/react-auth'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Send from './pages/Send'
import CreateProfile from './pages/CreateProfile'
import PublicProfile from './pages/PublicProfile'
import Browse from './pages/Browse'
import './index.css'

// Scroll Sepolia network configuration
const scrollSepolia = {
  id: 534351,
  name: 'Scroll Sepolia Testnet',
  network: 'scroll-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia-rpc.scroll.io/'],
    },
    public: {
      http: ['https://sepolia-rpc.scroll.io/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Scrollscan',
      url: 'https://sepolia.scrollscan.dev',
    },
  },
  testnet: true,
}

function App() {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID || 'placeholder-app-id'}
      config={{
        loginMethods: ['email', 'google', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#002FA7', // Klein Blue
          logo: '/logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
        supportedChains: [scrollSepolia],
        defaultChain: scrollSepolia,
      }}
    >
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/send" element={<Send />} />
              <Route path="/profile" element={<CreateProfile />} />
              <Route path="/u/:username" element={<PublicProfile />} />
            </Routes>
          </main>
        </div>
      </Router>
    </PrivyProvider>
  )
}

export default App
