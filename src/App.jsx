import { lazy, Suspense } from 'react'
import { PrivyProvider } from '@privy-io/react-auth'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ScrollToTop from './components/ScrollToTop'
import './index.css'

// Lazy load all pages for better performance
const Landing = lazy(() => import('./pages/Landing'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Send = lazy(() => import('./pages/Send'))
const Profile = lazy(() => import('./pages/Profile'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))
const Browse = lazy(() => import('./pages/Browse'))

// Loading fallback component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    fontSize: 'var(--font-size-lg)',
    color: 'var(--color-off-black)'
  }}>
    Loading...
  </div>
)

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
        <ScrollToTop />
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/send" element={<Send />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/u/:username" element={<PublicProfile />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </PrivyProvider>
  )
}

export default App
