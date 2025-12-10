import { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { uploadImage, uploadJSON, validateFile } from '../lib/pinata'

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

  const containerStyles = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: 'var(--spacing-3xl) var(--spacing-lg)',
  }

  const headerStyles = {
    fontSize: 'var(--font-size-5xl)',
    fontWeight: 'var(--font-weight-bold)',
    marginBottom: 'var(--spacing-sm)',
    textAlign: 'center',
  }

  const subheadStyles = {
    fontSize: 'var(--font-size-lg)',
    color: 'var(--color-off-black)',
    marginBottom: 'var(--spacing-3xl)',
    textAlign: 'center',
  }

  const splitLayoutStyles = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--spacing-3xl)',
    alignItems: 'start',
  }

  const previewCardStyles = {
    position: 'sticky',
    top: 'var(--spacing-2xl)',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
    padding: 'var(--spacing-2xl)',
    borderRadius: '16px',
    border: '2px solid var(--color-black)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
  }

  const uploadBoxStyles = {
    border: '3px dashed var(--color-accent)',
    borderRadius: '12px',
    padding: 'var(--spacing-3xl)',
    textAlign: 'center',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all var(--transition-base)',
    backgroundColor: 'rgba(0, 47, 167, 0.02)',
  }

  const previewImageStyles = {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    objectFit: 'cover',
    margin: '0 auto var(--spacing-lg)',
    border: '4px solid var(--color-accent)',
    boxShadow: '0 4px 12px rgba(0, 47, 167, 0.2)',
  }

  const previewNameStyles = {
    fontSize: 'var(--font-size-3xl)',
    fontWeight: 'var(--font-weight-bold)',
    marginBottom: 'var(--spacing-sm)',
    textAlign: 'center',
  }

  const previewBioStyles = {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-off-black)',
    marginBottom: 'var(--spacing-xl)',
    textAlign: 'center',
    lineHeight: '1.6',
  }

  const buttonGroupStyles = {
    display: 'flex',
    gap: 'var(--spacing-md)',
    justifyContent: 'center',
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

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
      const result = await setProfileOnChain(metadataResult.cid, username)

      if (!result.success) {
        throw new Error(result.error || 'Failed to store profile on blockchain')
      }

      setUploadProgress(100)

      const mode = result.isMock ? '(Development Mode - LocalStorage)' : '(Production - Blockchain)'
      console.log(`✅ Profile created successfully! ${mode}`)
      console.log('Metadata CID:', metadataResult.cid)
      console.log('TX Hash:', result.txHash)
      console.log('Username:', username)
      
      const successMessage = result.isMock
        ? `✅ Profile created in Development Mode!\n\nUsername: ${username}\n\nNote: This is stored locally. Deploy the ProfileRegistry contract for permanent blockchain storage.`
        : `✅ Profile created on Blockchain!\n\nUsername: ${username}\nTransaction: ${result.txHash}\n\nYour profile is now permanently stored and will load automatically on re-login.`
      
      alert(successMessage)
      
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
    <div style={containerStyles}>
      <h1 style={headerStyles}>Create Your Profile</h1>
      <p style={subheadStyles}>
        Set up your creator profile to start receiving support from around the world.
      </p>

      <div style={splitLayoutStyles}>
        {/* Left: Form */}
        <Card padding="xl">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
            <Input
              label="Display Name *"
              placeholder="Your name or artist name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />

            <div>
              <label style={{
                display: 'block',
                marginBottom: 'var(--spacing-sm)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }}>
                Bio
              </label>
              <textarea
                placeholder="Tell supporters about your work..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={6}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family)',
                  border: 'var(--border-width) solid var(--color-black)',
                  borderRadius: 'var(--border-radius)',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: 'var(--spacing-sm)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }}>
                Profile Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                id="profile-image-upload"
              />
              <label htmlFor="profile-image-upload" style={uploadBoxStyles}>
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px' }}
                  />
                ) : (
                  <div style={{ padding: 'var(--spacing-2xl)' }}>
                    <p style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-sm)', color: 'var(--color-accent)' }}>
                      📷
                    </p>
                    <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                      Click to upload
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-off-black)' }}>
                      JPG, PNG or GIF (max 10MB)
                    </p>
                  </div>
                )}
              </label>
            </div>

            {error && (
              <div style={{
                padding: 'var(--spacing-md)',
                backgroundColor: '#ffebee',
                border: '1px solid #ef5350',
                borderRadius: 'var(--border-radius)',
               color: '#c62828',
                fontSize: 'var(--font-size-sm)',
              }}>
                {error}
              </div>
            )}

            {uploading && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: 'var(--spacing-sm)',
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    backgroundColor: 'var(--color-accent)',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-off-black)' }}>
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              variant="primary" 
              fullWidth
              disabled={uploading || !authenticated}
            >
              {uploading ? 'Creating Profile...' : 'Create Profile'}
            </Button>

            {!authenticated && (
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-off-black)', textAlign: 'center' }}>
                Please <button onClick={login} style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>sign in</button> to create your profile
              </p>
            )}
          </form>
        </Card>

        {/* Right: Preview */}
        <div style={previewCardStyles}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-off-black)' }}>
            Live Preview
          </h3>
          
          {imagePreview && (
            <img 
              src={imagePreview} 
              alt="Profile" 
              style={previewImageStyles}
            />
          )}
          
          <h2 style={previewNameStyles}>
            {name || 'Your Name'}
          </h2>
          
          <p style={previewBioStyles}>
            {bio || 'Your bio will appear here...'}
          </p>
          
          <div style={buttonGroupStyles}>
            <Button variant="primary">
              Send Tip
            </Button>
            <Button variant="outline">
              Start Stream
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
