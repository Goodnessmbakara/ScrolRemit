import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Button from '../components/Button'

export default function Landing() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const heroStyles = {
    minHeight: '95vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-4xl) var(--spacing-lg)',
    position: 'relative',
    overflow: 'hidden',
  }

  const containerStyles = {
    maxWidth: '1280px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 2,
  }

  const heroGridStyles = {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: 'var(--spacing-4xl)',
    alignItems: 'center',
  }

  const headlineStyles = {
    fontSize: 'clamp(2.5rem, 8vw, 5rem)',
    fontWeight: 'var(--font-weight-bold)',
    lineHeight: '1.1',
    marginBottom: 'var(--spacing-2xl)',
    color: 'var(--color-black)',
  }

  const accentTextStyles = {
    background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-black) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'inline-block',
  }

  const subheadStyles = {
    fontSize: 'var(--font-size-xl)',
    lineHeight: '1.7',
    color: 'var(--color-off-black)',
    marginBottom: 'var(--spacing-3xl)',
    maxWidth: '600px',
  }

  const ctaContainerStyles = {
    display: 'flex',
    gap: 'var(--spacing-lg)',
    flexWrap: 'wrap',
  }

  const imageContainerStyles = {
    position: 'relative',
  }

  const imageStyles = {
    width: '100%',
    height: 'auto',
    border: '3px solid var(--color-black)',
    boxShadow: '12px 12px 0 var(--color-accent)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  }

  const floatingShapeStyles = {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0, 47, 167, 0.08) 0%, transparent 70%)',
    top: '10%',
    left: '-10%',
    transform: `translateY(${scrollY * 0.2}px)`,
    transition: 'transform 0.1s linear',
    pointerEvents: 'none',
  }

  const floatingShape2Styles = {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    border: '2px solid var(--color-accent)',
    opacity: 0.1,
    right: '5%',
    bottom: '15%',
    transform: `translateY(${scrollY * 0.15}px) rotate(${scrollY * 0.1}deg)`,
    transition: 'transform 0.1s linear',
    pointerEvents: 'none',
  }

  const sectionStyles = {
    padding: 'var(--spacing-5xl) var(--spacing-lg)',
    position: 'relative',
  }

  const sectionHeaderStyles = {
    fontSize: 'var(--font-size-4xl)',
    fontWeight: 'var(--font-weight-bold)',
    textAlign: 'center',
    marginBottom: 'var(--spacing-lg)',
  }

  const sectionSubheadStyles = {
    fontSize: 'var(--font-size-lg)',
    color: 'var(--color-off-black)',
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto var(--spacing-4xl)',
    lineHeight: '1.7',
  }

  const featureGridStyles = {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--spacing-3xl)',
  }

  const featureCardStyles = {
    padding: 'var(--spacing-3xl)',
    border: '2px solid var(--color-black)',
    position: 'relative',
    background: 'var(--color-white)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'default',
  }

  const featureNumberStyles = {
    fontSize: 'var(--font-size-6xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-accent)',
    opacity: 0.15,
    position: 'absolute',
    top: 'var(--spacing-lg)',
    right: 'var(--spacing-lg)',
    lineHeight: 1,
  }

  const featureTitleStyles = {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-bold)',
    marginBottom: 'var(--spacing-md)',
    color: 'var(--color-black)',
    position: 'relative',
  }

  const featureDescStyles = {
    fontSize: 'var(--font-size-base)',
    lineHeight: '1.7',
    color: 'var(--color-off-black)',
  }

  const ctaSectionStyles = {
    padding: 'var(--spacing-5xl) var(--spacing-lg)',
    textAlign: 'center',
    backgroundColor: 'var(--color-off-black)',
    color: 'var(--color-white)',
    position: 'relative',
    overflow: 'hidden',
  }

  const ctaHeadlineStyles = {
    fontSize: 'var(--font-size-4xl)',
    fontWeight: 'var(--font-weight-bold)',
    marginBottom: 'var(--spacing-xl)',
    color: 'var(--color-white)',
  }

  const ctaSubheadStyles = {
    fontSize: 'var(--font-size-lg)',
    marginBottom: 'var(--spacing-2xl)',
    opacity: 0.9,
    maxWidth: '600px',
    margin: '0 auto var(--spacing-2xl)',
  }

  return (
    <div>
      {/* Hero Section */}
      <section style={heroStyles}>
        {/* Floating background shapes */}
        <div style={floatingShapeStyles} />
        <div style={floatingShape2Styles} />

        <div style={containerStyles}>
          <div style={heroGridStyles} className="hero-grid">
            <div className="fade-in-up">
              <h1 style={headlineStyles}>
                Stream Money Home.{' '}
                <span style={accentTextStyles}>Second by Second.</span>
              </h1>
              <p style={subheadStyles}>
                ScrolRemit merges family remittance with creator patronage on Scroll network. 
                Enable real-time streaming payments for continuous liquidity and global support.
              </p>
              <div style={ctaContainerStyles}>
                <Link to="/dashboard">
                  <Button variant="primary" style={{ padding: 'var(--spacing-lg) var(--spacing-3xl)' }}>
                    Launch App →
                  </Button>
                </Link>
                <Link to="/browse">
                  <Button variant="secondary" style={{ padding: 'var(--spacing-lg) var(--spacing-3xl)' }}>
                    Browse Creators
                  </Button>
                </Link>
              </div>
            </div>
            <div style={imageContainerStyles} className="hero-image fade-in-up">
              <img 
                src="/hero-family.png" 
                alt="Real-time streaming payments"
                style={imageStyles}
                className="hover-lift"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={sectionStyles}>
        <h2 style={sectionHeaderStyles}>How It Works</h2>
        <p style={sectionSubheadStyles}>
          A dual-purpose platform designed for migrant workers sending money home 
          and supporters patronizing creators worldwide.
        </p>
        
        <div style={featureGridStyles} className="feature-grid">
          <div style={featureCardStyles} className="feature-card">
            <div style={featureNumberStyles}>01</div>
            <h3 style={featureTitleStyles}>Remittance Rail</h3>
            <p style={featureDescStyles}>
              Migrant workers stream funds home continuously, providing families
              with second-by-second liquidity instead of risky lump sum transfers.
              Built for financial security and independence.
            </p>
          </div>

          <div style={featureCardStyles} className="feature-card">
            <div style={featureNumberStyles}>02</div>
            <h3 style={featureTitleStyles}>Creator Patronage</h3>
            <p style={featureDescStyles}>
              Artisans and creators receive ongoing streams or instant tips from
              supporters worldwide. Build sustainable income through community
              patronage on Web3 rails.
            </p>
          </div>

          <div style={featureCardStyles} className="feature-card">
            <div style={featureNumberStyles}>03</div>
            <h3 style={featureTitleStyles}>Ticking Balance</h3>
            <p style={featureDescStyles}>
              Watch your available funds increase in real-time on your dashboard.
              The core innovation: continuous streaming creates perpetual liquidity,
              not discrete transactions.
            </p>
          </div>

          <div style={featureCardStyles} className="feature-card">
            <div style={featureNumberStyles}>04</div>
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
      <section style={ctaSectionStyles}>
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <h2 style={ctaHeadlineStyles}>
            Ready to Start Streaming?
          </h2>
          <p style={ctaSubheadStyles}>
            Join the future of global payments. Connect your wallet and start streaming or receiving funds in seconds.
          </p>
          <Link to="/dashboard">
            <Button 
              variant="outline" 
              style={{ 
                padding: 'var(--spacing-lg) var(--spacing-3xl)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
              }}
            >
              Connect Your Wallet
            </Button>
          </Link>
        </div>

        {/* Background accent */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 47, 167, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
      </section>

      {/* Animations and Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }

        .hero-image {
          animation-delay: 0.2s;
          animation-fill-mode: both;
        }

        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 16px 16px 0 var(--color-accent);
        }

        .feature-card {
          animation: fadeInUp 0.6s ease-out both;
        }

        .feature-card:nth-child(1) { animation-delay: 0.1s; }
        .feature-card:nth-child(2) { animation-delay: 0.2s; }
        .feature-card:nth-child(3) { animation-delay: 0.3s; }
        .feature-card:nth-child(4) { animation-delay: 0.4s; }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 8px 8px 0 var(--color-accent);
        }

        /* Responsive Styles */
        @media (max-width: 968px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: var(--spacing-3xl) !important;
          }
          
          .feature-grid {
            grid-template-columns: 1fr !important;
            gap: var(--spacing-2xl) !important;
          }
        }
        
        @media (max-width: 768px) {
          .hero-grid {
            text-align: center;
          }

          .hero-grid > div:first-child {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  )
}
