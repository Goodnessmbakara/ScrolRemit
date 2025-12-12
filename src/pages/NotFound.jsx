import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Button from '../components/Button'

export default function NotFound() {
  const [offsetY, setOffsetY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setOffsetY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const containerStyles = {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-4xl) var(--spacing-lg)',
    position: 'relative',
    overflow: 'hidden',
  }

  const contentStyles = {
    maxWidth: '800px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 2,
  }

  const numberStyles = {
    fontSize: 'clamp(8rem, 20vw, 16rem)',
    fontWeight: 'var(--font-weight-bold)',
    lineHeight: '1',
    marginBottom: 'var(--spacing-xl)',
    background: `linear-gradient(135deg, var(--color-black) 0%, var(--color-accent) 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.05em',
    animation: 'fadeInUp 0.8s ease-out',
  }

  const headlineStyles = {
    fontSize: 'var(--font-size-4xl)',
    fontWeight: 'var(--font-weight-semibold)',
    marginBottom: 'var(--spacing-lg)',
    color: 'var(--color-black)',
    animation: 'fadeInUp 0.8s ease-out 0.2s both',
  }

  const descriptionStyles = {
    fontSize: 'var(--font-size-xl)',
    lineHeight: '1.6',
    color: 'var(--color-off-black)',
    marginBottom: 'var(--spacing-2xl)',
    animation: 'fadeInUp 0.8s ease-out 0.4s both',
  }

  const buttonContainerStyles = {
    display: 'flex',
    gap: 'var(--spacing-md)',
    justifyContent: 'center',
    flexWrap: 'wrap',
    animation: 'fadeInUp 0.8s ease-out 0.6s both',
  }

  // Floating background element with parallax effect
  const floatingElementStyles = {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    border: `2px solid var(--color-accent)`,
    opacity: 0.1,
    top: '50%',
    left: '50%',
    transform: `translate(-50%, calc(-50% + ${offsetY * 0.5}px))`,
    transition: 'transform 0.1s ease-out',
    animation: 'pulse 4s ease-in-out infinite',
  }

  const floatingElement2Styles = {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    border: `2px solid var(--color-black)`,
    opacity: 0.05,
    top: '30%',
    right: '10%',
    transform: `translateY(${offsetY * 0.3}px)`,
    transition: 'transform 0.1s ease-out',
    animation: 'pulse 6s ease-in-out infinite',
  }

  return (
    <>
      <div style={containerStyles}>
        {/* Floating background elements */}
        <div style={floatingElementStyles} />
        <div style={floatingElement2Styles} />

        {/* Main content */}
        <div style={contentStyles}>
          <div style={numberStyles}>404</div>
          <h1 style={headlineStyles}>Page Not Found</h1>
          <p style={descriptionStyles}>
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
          <div style={buttonContainerStyles}>
            <Link to="/">
              <Button variant="primary">Back to Home</Button>
            </Link>
            <Link to="/browse">
              <Button variant="secondary">Browse Creators</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Animations */}
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

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.15;
          }
        }

        @media (max-width: 768px) {
          div[style*="600px"] {
            width: 400px !important;
            height: 400px !important;
          }
          div[style*="400px"] {
            width: 300px !important;
            height: 300px !important;
          }
        }
      `}</style>
    </>
  )
}
