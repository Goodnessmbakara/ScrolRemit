import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Send from './pages/Send'
import CreateProfile from './pages/CreateProfile'
import PublicProfile from './pages/PublicProfile'
import { WalletProvider, useWallet } from './context/WalletContext'
import './index.css'

function AppContent() {
  const { connected, address, connect } = useWallet()

  const handleConnectWallet = async () => {
    if (!connected) {
      await connect()
    }
  }

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar 
          walletConnected={connected}
          onConnectWallet={handleConnectWallet}
          userAddress={address}
        />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/send" element={<Send />} />
            <Route path="/profile" element={<CreateProfile />} />
            <Route path="/u/:username" element={<PublicProfile />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  )
}

export default App
