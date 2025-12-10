import { Link } from 'react-router-dom'
import Button from '../components/Button'

export default function Landing() {
  const heroStyles = {
    minHeight: '90vh',
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--spacing-4xl) var(--spacing-lg)',
  }

  const contentStyles = {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--spacing-4xl)',
    alignItems: 'center',
  }

  const headlineStyles = {
    fontSize: 'var(--font-size-6xl)',
    fontWeight: 'var(--font-weight-bold)',
    lineHeight: '1.1',
    marginBottom: 'var(--spacing-xl)',
    color: 'var(--color-black)',
  }

  const subheadStyles = {
    fontSize: 'var(--font-size-xl)',
    lineHeight: '1.6',
    color: 'var(--color-off-black)',
    marginBottom: 'var(--spacing-2xl)',
  }

  const ctaContainerStyles = {
    display: 'flex',
    gap: 'var(--spacing-md)',
  }

  const imageStyles = {
    width: '100%',
    height: 'auto',
    border: 'var(--border-width) solid var(--color-black)',
  }

  const sectionStyles = {
    padding: 'var(--spacing-5xl) var(--spacing-lg)',
  }

  const sectionHeaderStyles = {
    fontSize: 'var(--font-size-4xl)',
    fontWeight: 'var(--font-weight-semibold)',
    textAlign: 'center',
    marginBottom: 'var(--spacing-3xl)',
  }

  const featureGridStyles = {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--spacing-3xl)',
  }

  const featureStyles = {
    padding: 'var(--spacing-2xl)',
    border: 'var(--border-width) solid var(--color-black)',
  }

  const featureTitleStyles = {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-semibold)',
    marginBottom: 'var(--spacing-md)',
    color: 'var(--color-accent)',
  }

  const featureDescStyles = {
    fontSize: 'var(--font-size-base)',
    lineHeight: '1.6',
    color: 'var(--color-off-black)',
  }

  return (
    <div>
      {/* Hero Section */}
      <section style={heroStyles}>
        <div style={contentStyles}>
          <div>
            <h1 style={headlineStyles}>
              Stream Money Home.<br />
              Support Creators.<br />
              <span style={{ color: 'var(--color-accent)' }}>Second by Second.</span>
            </h1>
            <p style={subheadStyles}>
              ScrolRemit merges family remittance with creator patronage.
              Built on Scroll, enabling real-time streaming payments for
              continuous liquidity and global support.
            </p>
            <div style={ctaContainerStyles}>
              <Link to="/dashboard">
                <Button variant="primary">Launch App</Button>
              </Link>
              <a href="https://docs.scrolremit.com" target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">Read Docs</Button>
              </a>
            </div>
          </div>
          <div>
            <img 
              src="/hero-family.png" 
              alt="Real-time streaming payments"
              style={imageStyles}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={sectionStyles}>
        <h2 style={sectionHeaderStyles}>How It Works</h2>
        <div style={featureGridStyles}>
          <div style={featureStyles}>
            <h3 style={featureTitleStyles}>Remittance Rail</h3>
            <p style={featureDescStyles}>
              Migrant workers stream funds home continuously, providing families
              with second-by-second liquidity instead of risky lump sum transfers.
              Built for financial security and independence.
            </p>
          </div>
          <div style={featureStyles}>
            <h3 style={featureTitleStyles}>Creator Patronage</h3>
            <p style={featureDescStyles}>
              Artisans and creators receive ongoing streams or instant tips from
              supporters worldwide. Build sustainable income through community
              patronage on Web3 rails.
            </p>
          </div>
          <div style={featureStyles}>
            <h3 style={featureTitleStyles}>Ticking Balance</h3>
            <p style={featureDescStyles}>
              Watch your available funds increase in real-time on your dashboard.
              The core innovation: continuous streaming creates perpetual liquidity,
              not discrete transactions.
            </p>
          </div>
          <div style={featureStyles}>
            <h3 style={featureTitleStyles}>Powered by Scroll</h3>
            <p style={featureDescStyles}>
              Built on Scroll network for fast, low-cost transactions with
              Ethereum security. Seamless wallet integration and
              gasless claiming for optimal user experience.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section style={{
        ...sectionStyles,
        textAlign: 'center',
        backgroundColor: 'var(--color-off-black)',
        color: 'var(--color-white)',
      }}>
        <h2 style={{
          ...sectionHeaderStyles,
          color: 'var(--color-white)',
          marginBottom: 'var(--spacing-xl)',
        }}>
          Ready to Start Streaming?
        </h2>
        <Link to="/dashboard">
          <Button variant="outline">Connect Your Wallet</Button>
        </Link>
      </section>
    </div>
  )
}
