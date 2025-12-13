import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import Input from '../components/Input'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { uploadImage, uploadJSON, validateFile } from '../lib/pinata'
import { ensureGasBalance } from '../lib/gasHelper'
import { getPublicProvider, getProfileFromChain, setProfileOnChain, getUsername } from '../lib/contracts'
import { fetchFromIPFS } from '../lib/pinata'

export default function EditProfile() {
  const navigate = useNavigate()
  const { ready, authenticated } = usePrivy()
  const { wallets } = useWallets()
  
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [username, setUsername] = useState('') // Locked, display only
  const [currentImageUrl, setCurrentImageUrl] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [gasStatus, setGasStatus] = useState('')
  const [originalData, setOriginalData] = useState(null)

  // Load existing profile data on mount
  useEffect(() => {
    async function loadProfile() {
      console.log('🔍 [EDIT PROFILE] loadProfile called')
      console.log('🔍 [EDIT PROFILE] ready:', ready)
      console.log('🔍 [EDIT PROFILE] authenticated:', authenticated)
      console.log('🔍 [EDIT PROFILE] wallets.length:', wallets.length)
      
      // Wait for Privy to initialize first
      if (!ready) {
        console.log('⏳ [EDIT PROFILE] Waiting for Privy to be ready...')
        return // Stay in loading state, don't redirect yet
      }

      // Now Privy is ready - check authentication
      if (!authenticated || !wallets.length) {
        console.log('❌ [EDIT PROFILE] Not authenticated, redirecting to profile')
        navigate('/profile')
        return
      }

      try {
        console.log('📝 [EDIT PROFILE] Starting profile load...')
        setLoading(true)
        setError(null)

        const wallet = wallets[0]
        const address = wallet.address
        console.log('👛 [EDIT PROFILE] Wallet address:', address)

        // Get profile CID from blockchain
        console.log('🔗 [EDIT PROFILE] Fetching profile CID from blockchain...')
        const cid = await getProfileFromChain(address)
        console.log('📦 [EDIT PROFILE] Profile CID:', cid)
        
        if (!cid || cid === '') {
          console.error('❌ [EDIT PROFILE] No CID found!')
          setError('No profile found. Please create a profile first.')
          setLoading(false)
          // DON'T redirect automatically - let user see the error
          return
        }

        // Fetch metadata from IPFS
        console.log('🌐 [EDIT PROFILE] Fetching metadata from IPFS...')
        const metadata = await fetchFromIPFS(cid)
        console.log('📄 [EDIT PROFILE] Metadata loaded:', metadata)
        
        // Get username from blockchain (it's NOT in IPFS metadata!)
        console.log('🔗 [EDIT PROFILE] Fetching username from blockchain...')
        const userUsername = await getUsername(address)
        console.log('👤 [EDIT PROFILE] Username:', userUsername)
        
        if (!userUsername || userUsername === '') {
          console.error('❌ [EDIT PROFILE] No username found!')
          setError('Username not found. Your profile may be incomplete.')
          setLoading(false)
          // DON'T redirect automatically - let user see the error
          return
        }
        
        // Pre-populate form
        console.log('✅ [EDIT PROFILE] Populating form...')
        setName(metadata.name || '')
        setBio(metadata.bio || '')
        setUsername(userUsername) // From blockchain, NOT metadata
        
        // Handle image URL
        let imageUrl = metadata.imageUrl
        if ((!imageUrl || imageUrl === '' || imageUrl.includes('undefined')) && metadata.imageCid) {
          const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'
          const gatewayUrl = gateway.startsWith('http') ? gateway : `https://${gateway}`
          imageUrl = `${gatewayUrl}/ipfs/${metadata.imageCid}?img-width=500&img-quality=85&img-format=webp`
        }
        
        setCurrentImageUrl(imageUrl)
        setImagePreview(imageUrl) // Show current image as preview
        
        // Store original data for comparison
        setOriginalData(metadata)
        
        setLoading(false)
      } catch (err) {
        console.error('Error loading profile:', err)
        setError('Failed to load profile data. Please try again.')
        setLoading(false)
      }
    }

    loadProfile()
  }, [ready, authenticated, wallets]) // Removed navigate - it's stable from React Router

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    processFile(file)
  }

  const processFile = (file) => {
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

    if (!authenticated || !wallets.length) {
      setError('Please sign in to update your profile')
      return
    }

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    // Check if anything actually changed
    const nameChanged = name !== originalData?.name
    const bioChanged = bio !== originalData?.bio
    const imageChanged = imageFile !== null

    if (!nameChanged && !bioChanged && !imageChanged) {
      setError('No changes detected. Please modify at least one field.')
      return
    }

    setError(null)
    setUploading(true)
    setUploadProgress(5)

    try {
      const wallet = wallets[0]
      const SCROLL_SEPOLIA_CHAIN_ID = 534351
      
      // Ensure on correct network
      if (wallet.chainId !== `eip155:${SCROLL_SEPOLIA_CHAIN_ID}`) {
        setGasStatus('Switching to Scroll Sepolia testnet...')
        try {
          await wallet.switchChain(SCROLL_SEPOLIA_CHAIN_ID)
          setGasStatus('')
        } catch (error) {
          throw new Error('Please switch your wallet to Scroll Sepolia testnet')
        }
      }
      
      // Ensure gas balance
      const walletAddress = wallet.address
      const provider = getPublicProvider()
      
      setGasStatus('Checking gas balance...')
      const hasGas = await ensureGasBalance(walletAddress, provider, (status) => {
        setGasStatus(status)
      })

      if (!hasGas) {
        throw new Error('Unable to prepare wallet. Please ensure you have sufficient ETH.')
      }

      setGasStatus('')
      
      let profileImageUrl = currentImageUrl || ''
      let profileImageCid = originalData?.imageCid || ''

      // Upload new image if changed
      if (imageFile) {
        setUploadProgress(10)
        const imageResult = await uploadImage(imageFile, {
          name: `${name}-profile-image-updated`,
          metadata: {
            creator: name,
            updatedAt: new Date().toISOString()
          }
        }, (progress) => {
          setUploadProgress(10 + (progress * 0.3))
        })
        
        profileImageUrl = imageResult.optimizedUrl
        profileImageCid = imageResult.cid
      }

      // Upload updated metadata
      setUploadProgress(45)
      const metadata = {
        name,
        bio,
        username, // Keep same username (immutable)
        imageUrl: profileImageUrl,
        imageCid: profileImageCid,
        createdAt: originalData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0'
      }

      const metadataResult = await uploadJSON(metadata, {
        name: `${name}-profile-metadata-updated`
      })

      setUploadProgress(60)

      // Update profile on blockchain with new CID
      setUploadProgress(70)
      const result = await setProfileOnChain(metadataResult.cid, username, wallet)

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile on blockchain')
      }

      setUploadProgress(100)

      console.log('✅ Profile updated successfully!')
      console.log('New Metadata CID:', metadataResult.cid)
      console.log('TX Hash:', result.txHash)
      
      setSuccessData({
        username,
        txHash: result.txHash,
        isMock: result.isMock
      })
      setShowSuccessModal(true)
      
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err.message || 'Failed to update profile. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setGasStatus('')
    }
  }

  // Page styles (reuse from CreateProfile)
  const pageStyles = {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, rgba(0, 47, 167, 0.03) 0%, rgba(255, 255, 255, 1) 100%)',
    paddingTop: 'var(--spacing-4xl)',
    paddingBottom: 'var(--spacing-5xl)',
  }

  const containerStyles = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 var(--spacing-lg)',
  }

  const headerStyles = {
    fontSize: 'var(--font-size-6xl)',
    fontWeight: 'var(--font-weight-bold)',
    marginBottom: 'var(--spacing-md)',
    textAlign: 'center',
    background: 'linear-gradient(135deg, var(--color-black) 0%, var(--color-accent) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }

  const formCardStyles = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    border: '2px solid var(--color-black)',
    padding: 'var(--spacing-3xl)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)',
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

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        flexDirection: 'column',
        gap: 'var(--spacing-lg)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid var(--color-light-gray)',
          borderTopColor: 'var(--color-accent)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-off-black)' }}>
          Loading your profile...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={pageStyles}>
      <div style={containerStyles}>
        <h1 style={headerStyles}>Edit Your Profile</h1>
        <p style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-off-black)',
          textAlign: 'center',
          marginBottom: 'var(--spacing-3xl)',
          maxWidth: '600px',
          margin: '0 auto var(--spacing-3xl)',
        }}>
          Update your profile information. Your username is permanent and cannot be changed.
        </p>

        <div style={formCardStyles}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
            {/* Username - Locked Display */}
            <div>
              <label style={labelStyles}>
                Username (Permanent)
              </label>
              <div style={{
                padding: 'var(--spacing-lg)',
                backgroundColor: '#F7FAFC',
                border: '2px solid #CBD5E0',
                borderRadius: 'var(--border-radius)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: '#4A5568',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
              }}>
                <span>@{username}</span>
                <span style={{ fontSize: 'var(--font-size-sm)', color: '#718096' }}>🔒</span>
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: '#718096', marginTop: 'var(--spacing-xs)' }}>
                Usernames cannot be changed to protect your profile URL and payment links
              </p>
            </div>

            {/* Display Name */}
            <Input
              label="Display Name *"
              placeholder="Your name or artist name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />

            {/* Bio */}
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

            {/* Profile Photo */}
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
              >
                {imagePreview ? (
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{ 
                        width: '100%', 
                        maxHeight: '320px', 
                        objectFit: 'contain', 
                        borderRadius: '12px',
                        display: 'block'
                      }}
                    />
                    <p style={{ 
                      marginTop: 'var(--spacing-md)', 
                      fontSize: 'var(--font-size-sm)', 
                      color: 'var(--color-accent)' 
                    }}>
                      Click or drag to change image
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      margin: '0 auto var(--spacing-lg)',
                      background: 'linear-gradient(135deg, var(--color-accent) 0%, #0047D1 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--font-size-4xl)',
                    }}>
                      <span>📸</span>
                    </div>
                    <p style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-xs)', fontWeight: 'var(--font-weight-semibold)' }}>
                      Drop your photo here
                    </p>
                    <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-off-black)' }}>
                      or click to browse
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Error Display */}
            {error && (
              <div style={{
                padding: 'var(--spacing-lg)',
                backgroundColor: '#FEE2E2',
                border: '2px solid #EF4444',
                borderRadius: '12px',
                color: '#991B1B',
                fontSize: 'var(--font-size-base)',
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Gas Status */}
            {gasStatus && (
              <div style={{ 
                padding: 'var(--spacing-md)', 
                backgroundColor: 'rgba(0, 47, 167, 0.05)', 
                borderRadius: 'var(--border-radius)', 
                textAlign: 'center' 
              }}>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)' }}>
                  {gasStatus}
                </p>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div>
                <div style={progressBarContainerStyles}>
                  <div style={{ ...progressBarFillStyles, width: `${uploadProgress}%` }} />
                </div>
                <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-accent)', textAlign: 'center' }}>
                  Updating your profile... {uploadProgress}%
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
              <Button 
                type="button"
                variant="outline" 
                fullWidth
                onClick={() => navigate('/profile')}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                fullWidth
                disabled={uploading}
              >
                {uploading ? '✨ Updating...' : '💾 Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          navigate('/profile')
        }}
        title="✅ Profile Updated!"
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto var(--spacing-xl)',
            backgroundColor: 'var(--color-accent)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            color: 'white',
          }}>
            ✓
          </div>

          <p style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-off-black)',
            marginBottom: 'var(--spacing-xl)',
          }}>
            Your profile has been successfully updated on the blockchain!
          </p>

          {successData?.txHash && !successData.txHash.startsWith('mock') && (
            <Button
              variant="outline"
              onClick={() => window.open(`https://sepolia.scrollscan.com/tx/${successData.txHash}`, '_blank')}
              style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}
            >
              View on Scrollscan →
            </Button>
          )}

          <Button
            variant="primary"
            onClick={() => {
              setShowSuccessModal(false)
              navigate('/profile')
            }}
            style={{ width: '100%' }}
          >
            View My Profile
          </Button>
        </div>
      </Modal>
    </div>
  )
}
