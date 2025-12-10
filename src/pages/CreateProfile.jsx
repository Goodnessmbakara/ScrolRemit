import { useState } from 'react'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { uploadImage, uploadJSON, validateFile } from '../lib/pinata'

export default function CreateProfile() {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)

  const containerStyles = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: 'var(--spacing-3xl) var(--spacing-lg)',
  }

  const headerStyles = {
    fontSize: 'var(--font-size-4xl)',
    fontWeight: 'var(--font-weight-semibold)',
    marginBottom: 'var(--spacing-md)',
  }

  const subheadStyles = {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-off-black)',
    marginBottom: 'var(--spacing-2xl)',
  }

  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--spacing-2xl)',
  }

  const imageUploadStyles = {
    width: '100%',
    height: '300px',
    border: `var(--border-width-thick) dashed var(--color-black)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'border-color var(--transition-base)',
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
    
    if (!name || !bio) {
      setError('Please fill in all required fields')
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      let profileImageUrl = ''
      let profileImageCid = ''

      // Upload image if provided
      if (imageFile) {
        const imageResult = await uploadImage(imageFile, {
          name: `${name}-profile-image`,
          metadata: {
            creator: name
          }
        }, (progress) => {
          setUploadProgress(progress * 0.5) // First 50% for image
        })
        
        profileImageUrl = imageResult.optimizedUrl // Use optimized URL
        profileImageCid = imageResult.cid
      }

      // Upload profile metadata as JSON
      const metadata = {
        name,
        bio,
        imageUrl: profileImageUrl,
        imageCid: profileImageCid,
        createdAt: new Date().toISOString(),
        version: '1.0'
      }

      setUploadProgress(60)
      const metadataResult = await uploadJSON(metadata, {
        name: `${name}-profile-metadata`
      })

      setUploadProgress(100)

      console.log('Profile created successfully!')
      console.log('Metadata IPFS Hash:', metadataResult.ipfsHash)
      console.log('Metadata URL:', metadataResult.url)
      
      // TODO: Save profile CID to smart contract or local state
      alert(`Profile created! Metadata CID: ${metadataResult.cid}`)
      
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

      <div style={gridStyles}>
        <div>
          <Card padding="lg">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              <Input
                label="Display Name"
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
                <label htmlFor="profile-image-upload" style={imageUploadStyles}>
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--color-off-black)' }}>
                      <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-sm)' }}>
                        Click to upload
                      </p>
                      <p style={{ fontSize: 'var(--font-size-sm)' }}>
                        JPG, PNG or GIF
                      </p>
                    </div>
                  )}
                </label>
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                fullWidth 
                onClick={handleSubmit}
                disabled={uploading || !name || !bio}
              >
                {uploading ? `Creating Profile... ${uploadProgress}%` : 'Create Profile'}
              </Button>

              {error && (
                <p style={{ 
                  color: 'var(--color-accent)', 
                  fontSize: 'var(--font-size-sm)',
                  marginTop: 'var(--spacing-md)'
                }}>
                  {error}
                </p>
              )}

              {uploading && (
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                  <div style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: 'var(--color-off-black)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      backgroundColor: 'var(--color-accent)',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card padding="lg" border={true}>
            <h3 style={{ 
              fontSize: 'var(--font-size-xl)', 
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-lg)',
            }}>
              Preview
            </h3>
            <div style={{ 
              width: '100%', 
              height: '200px', 
              backgroundColor: '#f5f5f5',
              marginBottom: 'var(--spacing-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: 'var(--color-off-black)' }}>No image</span>
              )}
            </div>
            <h4 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-sm)' }}>
              {name || 'Your Name'}
            </h4>
            <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-off-black)', marginBottom: 'var(--spacing-lg)' }}>
              {bio || 'Your bio will appear here...'}
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <Button variant="primary" fullWidth>Send Tip</Button>
              <Button variant="outline" fullWidth>Start Stream</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
