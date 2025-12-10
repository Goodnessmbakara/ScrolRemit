import { PinataSDK } from 'pinata'

// Initialize Pinata SDK with error handling
// NOTE: In production, use backend API to generate presigned URLs instead of exposing JWT
let pinata = null

try {
  if (import.meta.env.VITE_PINATA_JWT) {
    pinata = new PinataSDK({
      pinataJwt: import.meta.env.VITE_PINATA_JWT,
      pinataGateway: import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'
    })
  }
} catch (error) {
  console.warn('Failed to initialize Pinata SDK:', error.message)
  pinata = null
}

/**
 * Upload image to IPFS via Pinata with optimization
 * @param {File} file - Image file to upload
 * @param {Object} options - Upload options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<{ipfsHash: string, url: string, cid: string}>}
 */
export async function uploadImage(file, options = {}, onProgress) {
  // Validate file
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${validTypes.join(', ')}`)
  }

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size: 10MB`)
  }

  // Check if Pinata SDK is properly initialized
  if (!pinata || !import.meta.env.VITE_PINATA_JWT) {
    console.warn('Pinata not configured or failed to initialize. Using mock upload for development.')
    return mockUpload(file, onProgress)
  }

  try {
    // Report initial progress
    if (onProgress) onProgress(0)

    // Upload file using Pinata SDK v2.5.1 API
    const upload = await pinata.upload.file(file, {
      metadata: {
        name: options.name || file.name,
        keyvalues: {
          type: 'profile-image',
          category: 'creator',
          uploadedAt: new Date().toISOString(),
          ...options.metadata
        }
      },
      groupId: options.groupId, // Optional: organize uploads
    })

    if (onProgress) onProgress(100)

    // Get dedicated gateway URL with optimization
    const gatewayUrl = pinata.config.pinataGateway

    return {
      ipfsHash: upload.IpfsHash,
      cid: upload.cid,
      url: `https://${gatewayUrl}/ipfs/${upload.IpfsHash}`,
      // Optimized image URL with resize and compression
      optimizedUrl: `https://${gatewayUrl}/ipfs/${upload.IpfsHash}?img-width=500&img-quality=85&img-format=webp`
    }
  } catch (error) {
    console.error('Error uploading image to Pinata:', error)
    throw new Error(`Upload failed: ${error.message}`)
  }
}

/**
 * Upload JSON metadata to IPFS
 * @param {Object} jsonData - JSON object to upload
 * @param {Object} options - Upload options
 * @returns {Promise<{ipfsHash: string, url: string, cid: string}>}
 */
export async function uploadJSON(jsonData, options = {}) {
  if (!pinata || !import.meta.env.VITE_PINATA_JWT) {
    console.warn('Pinata not configured or failed to initialize. Using mock upload for development.')
    return {
      ipfsHash: 'Qm' + Math.random().toString(36).substring(7),
      cid: 'baf' + Math.random().toString(36).substring(7),
      url: '#mock-ipfs-url'
    }
  }

  try {
    // Upload JSON using Pinata SDK v2.5.1 API
    const upload = await pinata.upload.json(jsonData, {
      metadata: {
        name: options.name || 'profile-metadata',
        keyvalues: {
          type: 'profile-metadata',
          category: 'creator',
          uploadedAt: new Date().toISOString(),
          ...options.metadata
        }
      },
      groupId: options.groupId,
    })

    const gatewayUrl = pinata.config.pinataGateway

    return {
      ipfsHash: upload.IpfsHash,
      cid: upload.cid,
      url: `https://${gatewayUrl}/ipfs/${upload.IpfsHash}`
    }
  } catch (error) {
    console.error('Error uploading JSON to Pinata:', error)
    throw new Error(`JSON upload failed: ${error.message}`)
  }
}

/**
 * Fetch data from IPFS via Pinata gateway
 * @param {string} ipfsHashOrCid - IPFS hash or CID
 * @returns {Promise<any>} - Parsed JSON or response data
 */
export async function fetchFromIPFS(ipfsHashOrCid) {
  const gatewayUrl = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'

  try {
    const response = await fetch(`https://${gatewayUrl}/ipfs/${ipfsHashOrCid}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }

    return await response.text()
  } catch (error) {
    console.error('Error fetching from IPFS:', error)
    throw new Error(`IPFS fetch failed: ${error.message}`)
  }
}

/**
 * Get optimized image URL from IPFS hash
 * @param {string} ipfsHash - IPFS hash
 * @param {Object} options - Optimization options
 * @returns {string} - Optimized image URL
 */
export function getOptimizedImageUrl(ipfsHash, options = {}) {
  const {
    width = 500,
    quality = 85,
    format = 'webp'
  } = options

  const gatewayUrl = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'

  return `https://${gatewayUrl}/ipfs/${ipfsHash}?img-width=${width}&img-quality=${quality}&img-format=${format}`
}

/**
 * Mock upload for development (when Pinata not configured)
 * @private
 */
async function mockUpload(file, onProgress) {
  // Simulate upload progress
  for (let i = 0; i <= 100; i += 20) {
    if (onProgress) onProgress(i)
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  const mockHash = 'Qm' + Math.random().toString(36).substring(7)
  const objectUrl = URL.createObjectURL(file)

  return {
    ipfsHash: mockHash,
    cid: 'baf' + Math.random().toString(36).substring(7),
    url: objectUrl,
    optimizedUrl: objectUrl,
    isMock: true
  }
}

/**
 * Validate and prepare file for upload
 * @param {File} file - File to validate
 * @returns {Object} - Validation result
 */
export function validateFile(file) {
  const errors = []

  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    errors.push(`Invalid file type "${file.type}". Allowed: JPEG, PNG, WebP, GIF`)
  }

  // Check file size
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    errors.push(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum: 10MB`)
  }

  // Check dimensions (requires reading file)
  return {
    valid: errors.length === 0,
    errors,
    size: file.size,
    type: file.type
  }
}

export default {
  uploadImage,
  uploadJSON,
  fetchFromIPFS,
  getOptimizedImageUrl,
  validateFile
}
