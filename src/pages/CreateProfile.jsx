import { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { uploadImage, uploadJSON, validateFile } from '../lib/pinata'
import { ensureGasBalance } from '../lib/gasHelper'
import { getPublicProvider } from '../lib/contracts'

export default function CreateProfile() {
  const { ready, authenticated, login } = usePrivy()
  const { wallets } = useWallets()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [gasStatus, setGasStatus] = useState('') // For gas funding status messages

  const pageStyles = {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, rgba(0, 47, 167, 0.03) 0%, rgba(255, 255, 255, 1) 100%)',
    paddingTop: 'var(--spacing-4xl)',
    paddingBottom: 'var(--spacing-5xl)',
  }

  const containerStyles = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 var(--spacing-lg)',
  }

  const headerWrapperStyles = {
    textAlign: 'center',
    marginBottom: 'var(--spacing-4xl)',
  }

  const headerStyles = {
    fontSize: 'var(--font-size-6xl)',
    fontWeight: 'var(--font-weight-bold)',
    marginBottom: 'var(--spacing-md)',
    background: 'linear-gradient(135deg, var(--color-black) 0%, var(--color-accent) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }

  const subheadStyles = {
    fontSize: 'var(--font-size-xl)',
    color: 'var(--color-off-black)',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: '1.6',
  }

  const splitLayoutStyles = {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: 'var(--spacing-4xl)',
    alignItems: 'start',
  }

  const formCardStyles = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    border: '2px solid var(--color-black)',
    padding: 'var(--spacing-3xl)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  }

  const previewContainerStyles = {
    position: 'sticky',
    top: 'var(--spacing-3xl)',
  }

  const previewCardStyles = {
    background: 'linear-gradient(135deg, rgba(0, 47, 167, 0.05) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(0, 47, 167, 0.05) 100%)',
    backdropFilter: 'blur(20px)',
    padding: 'var(--spacing-3xl)',
    borderRadius: '28px',
    border: '3px solid var(--color-black)',
    boxShadow: '0 24px 48px rgba(0, 47, 167, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    position: 'relative',
    overflow: 'hidden',
  }

  const previewLabelStyles = {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-semibold)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--color-accent)',
    marginBottom: 'var(--spacing-xl)',
    textAlign: 'center',
  }

  const uploadBoxStyles = {
    border: isDragging ? '3px solid var(--color-accent)' : '3px dashed #CBD5E0',
    borderRadius: '16px',
    padding: 'var(--spacing-3xl)',
    textAlign: 'center',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    backgroundColor: isDragging ? 'rgba(0, 47, 167, 0.08)' : 'rgba(0, 47, 167, 0.02)',
    transform: isDragging ? 'scale(1.02)' : 'scale(1)',
  }

  const uploadIconWrapperStyles = {
    width: '80px',
    height: '80px',
    margin: '0 auto var(--spacing-lg)',
    background: 'linear-gradient(135deg, var(--color-accent) 0%, #0047D1 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--font-size-4xl)',
    boxShadow: '0 10px 30px rgba(0, 47, 167, 0.3)',
    transition: 'transform 0.3s ease',
  }

  const imagePreviewContainerStyles = {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
  }

  const previewImageWrapperStyles = {
    width: '220px',
    height: '220px',
    margin: '0 auto var(--spacing-xl)',
    position: 'relative',
  }

  const previewImageStyles = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '5px solid var(--color-accent)',
    boxShadow: '0 10px 40px rgba(0, 47, 167, 0.3), 0 0 0 10px rgba(0, 47, 167, 0.05)',
    animation: 'fadeIn 0.5s ease',
  }

  const previewPlaceholderStyles = {
    width: '220px',
    height: '220px',
    margin: '0 auto var(--spacing-xl)',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E0 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--font-size-6xl)',
    border: '5px solid #CBD5E0',
  }

  const previewNameStyles = {
    fontSize: 'var(--font-size-4xl)',
    fontWeight: 'var(--font-weight-bold)',
    marginBottom: 'var(--spacing-md)',
    textAlign: 'center',
    color: 'var(--color-black)',
  }

  const previewBioStyles = {
    fontSize: 'var(--font-size-lg)',
    color: 'var(--color-off-black)',
    marginBottom: 'var(--spacing-2xl)',
    textAlign: 'center',
    lineHeight: '1.8',
    minHeight: '60px',
  }

  const buttonGroupStyles = {
    display: 'flex',
    gap: 'var(--spacing-md)',
    justifyContent: 'center',
    marginTop: 'var(--spacing-xl)',
  }

  const labelStyles = {
    display: 'block',
    marginBottom: 'var(--spacing-sm)',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-black)',
  }

  const textareaStyles = {
    width: '100%',
    padding: 'var(--spacing-lg)',
    fontSize: 'var(--font-size-base)',
    fontFamily: 'var(--font-family)',
    border: '2px solid var(--color-black)',
    borderRadius: 'var(--border-radius)',
    outline: 'none',
    resize: 'vertical',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    lineHeight: '1.6',
  }

  const progressBarContainerStyles = {
    width: '100%',
    height: '12px',
    backgroundColor: '#E2E8F0',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: 'var(--spacing-md)',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
  }

  const progressBarFillStyles = {
    height: '100%',
    background: 'linear-gradient(90deg, var(--color-accent) 0%, #0047D1 100%)',
    transition: 'width 0.3s ease',
    borderRadius: '6px',
    boxShadow: '0 0 10px rgba(0, 47, 167, 0.5)',
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    processFile(file)
  }

  const processFile = (file) => {
    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.errors.join('. '))
      return
    }

    setError(null)
    setImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      processFile(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Check authentication
    if (!authenticated || !wallets.length) {
      setError('Please sign in with your wallet to create a profile')
      return
    }

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setError(null)
    setUploading(true)
    setUploadProgress(5)

    try {
      // Ensure wallet is on correct network first
      const wallet = wallets[0]
      const SCROLL_SEPOLIA_CHAIN_ID = 534351
      
      console.log('🔍 [PROFILE] Current chain:', wallet.chainId)
      console.log('🎯 [PROFILE] Target chain: eip155:' + SCROLL_SEPOLIA_CHAIN_ID)
      
      if (wallet.chainId !== `eip155:${SCROLL_SEPOLIA_CHAIN_ID}`) {
        console.log('🔄 [PROFILE] Switching to Scroll Sepolia...')
        setGasStatus('Switching to Scroll Sepolia testnet...')
        try {
          await wallet.switchChain(SCROLL_SEPOLIA_CHAIN_ID)
          console.log('✅ [PROFILE] Network switched successfully')
          setGasStatus('')
        } catch (error) {
          console.error('❌ [PROFILE] Network switch failed:', error)
          throw new Error('Please switch your wallet to Scroll Sepolia testnet (Chain ID: 534351)')
        }
      }
      
      // Auto-fund wallet if needed (before any blockchain operations)
      console.log('🚀 [PROFILE] Starting profile creation flow')
      const walletAddress = wallet.address
      console.log('👛 [PROFILE] Wallet address:', walletAddress)
      
      const provider = getPublicProvider()
      console.log('🔌 [PROFILE] Provider initialized')
      
      console.log('⛽ [PROFILE] Checking/ensuring gas balance...')
      const hasGas = await ensureGasBalance(walletAddress, provider, (status) => {
        setGasStatus(status)
        console.log('📢 [PROFILE] Status update:', status)
      })

      console.log('✔️ [PROFILE] Gas check complete. Has gas:', hasGas)
      
      if (!hasGas) {
        const errorMsg = 'Unable to prepare wallet. The funding service may be unavailable. Please ensure you have sufficient ETH or try again later.'
        console.error('🚫 [PROFILE] Funding failed, aborting profile creation')
        throw new Error(errorMsg)
      }

      setGasStatus('') // Clear status after successful funding
      console.log('✅ [PROFILE] Wallet ready, proceeding with profile creation')
      
      let profileImageUrl = ''
      let profileImageCid = ''

      // Upload image if provided
      if (imageFile) {
        setUploadProgress(10)
        const imageResult = await uploadImage(imageFile, {
          name: `${name}-profile-image`,
          metadata: {
            creator: name
          }
        }, (progress) => {
          setUploadProgress(10 + (progress * 0.3)) // 10-40% for image
        })
        
        profileImageUrl = imageResult.optimizedUrl // Use optimized URL
        profileImageCid = imageResult.cid
      }

      // Upload profile metadata as JSON
      setUploadProgress(45)
      const metadata = {
        name,
        bio,
        imageUrl: profileImageUrl,
        imageCid: profileImageCid,
        createdAt: new Date().toISOString(),
        version: '1.0'
      }

      const metadataResult = await uploadJSON(metadata, {
        name: `${name}-profile-metadata`
      })

      setUploadProgress(60)

      // Store profile CID on-chain (CRITICAL for persistence!)
      setUploadProgress(70)
      const username = name.toLowerCase().replace(/\s+/g, '-') // Convert to username format
      
      const { setProfileOnChain } = await import('../lib/contracts')
      const result = await setProfileOnChain(metadataResult.cid, username, wallets[0])

      if (!result.success) {
        throw new Error(result.error || 'Failed to store profile on blockchain')
      }

      setUploadProgress(100)

      const mode = result.isMock ? '(Development Mode - LocalStorage)' : '(Production - Blockchain)'
      console.log(`✅ Profile created successfully! ${mode}`)
      console.log('Metadata CID:', metadataResult.cid)
      console.log('TX Hash:', result.txHash)
      console.log('Username:', username)
      
      // Set success data for modal
      setSuccessData({
        username,
        txHash: result.txHash,
        needsGas: result.needsGas,
        isMock: result.isMock,
        message: result.message
      })
      setShowSuccessModal(true)
      
      // Reset form
      setName('')
      setBio('')
      setImageFile(null)
      setImagePreview(null)
    } catch (err) {
      console.error('Error creating profile:', err)
      setError(err.message || 'Failed to create profile. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div style={pageStyles}>
      <div style={containerStyles}>
        <div style={headerWrapperStyles}>
          <h1 style={headerStyles}>Create Your Profile</h1>
          <p style={subheadStyles}>
            Set up your creator profile to start receiving support from around the world.
          </p>
        </div>

        <div style={splitLayoutStyles}>
          {/* Left: Form */}
          <div style={formCardStyles}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
              <Input
                label="Display Name *"
                placeholder="Your name or artist name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />

              <div>
                <label style={labelStyles}>
                  Bio
                </label>
                <textarea
                  placeholder="Tell supporters about your work..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={6}
                  style={textareaStyles}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-accent)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 47, 167, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-black)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div>
                <label style={labelStyles}>
                  Profile Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="profile-image-upload"
                />
                <label 
                  htmlFor="profile-image-upload" 
                  style={uploadBoxStyles}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onMouseEnter={(e) => {
                    if (!imagePreview && !isDragging) {
                      e.currentTarget.style.borderColor = 'var(--color-accent)'
                      e.currentTarget.style.backgroundColor = 'rgba(0, 47, 167, 0.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!imagePreview && !isDragging) {
                      e.currentTarget.style.borderColor = '#CBD5E0'
                      e.currentTarget.style.backgroundColor = 'rgba(0, 47, 167, 0.02)'
                    }
                  }}
                >
                  {imagePreview ? (
                    <div style={imagePreviewContainerStyles}>
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', display: 'block' }}
                      />
                    </div>
                  ) : (
                    <div>
                      <div style={uploadIconWrapperStyles}>
                        <span>📸</span>
                      </div>
                      <p style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-black)' }}>
                        Drop your photo here
                      </p>
                      <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-off-black)', marginBottom: 'var(--spacing-sm)' }}>
                        or click to browse
                      </p>
                      <p style={{ fontSize: 'var(--font-size-sm)', color: '#718096' }}>
                        JPG, PNG or GIF • Max 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {error && (
                <div style={{
                  padding: 'var(--spacing-lg)',
                  backgroundColor: '#FEE2E2',
                  border: '2px solid #EF4444',
                  borderRadius: '12px',
                  color: '#991B1B',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-medium)',
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Gas funding status */}
              {gasStatus && (
                <div style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-md)', backgroundColor: 'rgba(0, 47, 167, 0.05)', borderRadius: 'var(--border-radius)', textAlign: 'center' }}>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)', fontWeight: 'var(--font-weight-medium)' }}>
                    {gasStatus}
                  </p>
                </div>
              )}

              {/* Upload progress */}
              {uploading && (
                <div>
                  <div style={progressBarContainerStyles}>
                    <div style={{ ...progressBarFillStyles, width: `${uploadProgress}%` }} />
                  </div>
                  <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-accent)', textAlign: 'center', fontWeight: 'var(--font-weight-semibold)' }}>
                    Creating your profile... {uploadProgress}%
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                variant="primary" 
                fullWidth
                disabled={uploading || !authenticated}
              >
                {uploading ? '✨ Creating Profile...' : '🚀 Create Profile'}
              </Button>

              {!authenticated && (
                <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-off-black)', textAlign: 'center' }}>
                  Please <button onClick={login} style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'var(--font-weight-semibold)' }}>sign in</button> to create your profile
                </p>
              )}
            </form>
          </div>

          {/* Right: Preview */}
          <div style={previewContainerStyles}>
            <div style={previewCardStyles}>
              <div style={previewLabelStyles}>
                Preview
              </div>
              
              {imagePreview ? (
                <div style={previewImageWrapperStyles}>
                  <img 
                    src={imagePreview} 
                    alt="Profile" 
                    style={previewImageStyles}
                  />
                </div>
              ) : (
                <div style={previewPlaceholderStyles}>
                  👤
                </div>
              )}
              
              <h2 style={previewNameStyles}>
                {name || 'Your Name'}
              </h2>
              
              <p style={previewBioStyles}>
                {bio || 'Your bio will appear here...'}
              </p>
              
              <div style={buttonGroupStyles}>
                <Button variant="primary">
                  💸 Send Tip
                </Button>
                <Button variant="outline">
                  📺 Start Stream
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="🎉 Profile Created!"
      >
        <div style={{ textAlign: 'center' }}>
          {/* Success Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto var(--spacing-xl)',
            backgroundColor: 'var(--color-primary)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
          }}>
            ✓
          </div>

          {/* Username */}
          <h3 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--spacing-sm)',
            color: 'var(--color-primary)'
          }}>
            @{successData?.username}
          </h3>

          {/* Success Message */}
          <p style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-off-black)',
            marginBottom: 'var(--spacing-xl)',
            lineHeight: 1.5
          }}>
            {successData?.isMock 
              ? 'Your profile was created in development mode and saved locally.'
              : successData?.needsGas
                ? 'Profile saved locally. Get testnet ETH to save on-chain.'
                : 'Your profile is now permanently stored on the Scroll blockchain!'}
          </p>

          {/* Transaction Details */}
          {successData?.txHash && !successData.txHash.startsWith('local') && (
            <div style={{
              backgroundColor: 'var(--color-light-gray)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--border-radius-md)',
              marginBottom: 'var(--spacing-xl)',
              textAlign: 'left'
            }}>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                color: '#666',
                marginBottom: 'var(--spacing-xs)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                Transaction Hash
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: 'var(--font-size-sm)',
                wordBreak: 'break-all',
                color: 'var(--color-black)'
              }}>
                {successData.txHash}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexDirection: 'column' }}>
            {successData?.txHash && !successData.txHash.startsWith('local') && (
              <Button
                variant="outline"
                onClick={() => window.open(`https://sepolia.scrollscan.com/tx/${successData.txHash}`, '_blank')}
                style={{ width: '100%' }}
              >
                View on Scrollscan →
              </Button>
            )}
            
            {successData?.needsGas && (
              <Button
                variant="outline"
                onClick={() => window.open('https://sepolia.scroll.io/faucet', '_blank')}
                style={{ width: '100%' }}
              >
                Get Testnet ETH
              </Button>
            )}

            <Button
              variant="primary"
              onClick={() => {
                setShowSuccessModal(false)
                window.location.href = '/profile'
              }}
              style={{ width: '100%' }}
            >
              View My Profile
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
