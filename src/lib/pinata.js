// Placeholder for Pinata IPFS integration
// In production, you'll need to get API keys from https://pinata.cloud

const PINATA_API_KEY = process.env.VITE_PINATA_API_KEY || ''
const PINATA_SECRET_KEY = process.env.VITE_PINATA_SECRET_KEY || ''
const PINATA_JWT = process.env.VITE_PINATA_JWT || ''

// Upload image to IPFS via Pinata
export async function uploadImage(file) {
  if (!PINATA_JWT && !PINATA_API_KEY) {
    console.warn('Pinata credentials not configured. Using mock upload.')
    // Return mock IPFS hash for development
    return {
      ipfsHash: 'Qm' + Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file)
    }
  }

  const formData = new FormData()
  formData.append('file', file)

  const metadata = JSON.stringify({
    name: file.name,
  })
  formData.append('pinataMetadata', metadata)

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    })

    const data = await response.json()
    return {
      ipfsHash: data.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
    }
  } catch (error) {
    console.error('Error uploading to Pinata:', error)
    throw error
  }
}

// Upload JSON metadata to IPFS
export async function uploadJSON(jsonData) {
  if (!PINATA_JWT && !PINATA_API_KEY) {
    console.warn('Pinata credentials not configured. Using mock upload.')
    return {
      ipfsHash: 'Qm' + Math.random().toString(36).substring(7),
      url: '#'
    }
  }

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify(jsonData),
    })

    const data = await response.json()
    return {
      ipfsHash: data.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
    }
  } catch (error) {
    console.error('Error uploading JSON to Pinata:', error)
    throw error
  }
}

// Fetch metadata from IPFS
export async function fetchFromIPFS(ipfsHash) {
  try {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`)
    return await response.json()
  } catch (error) {
    console.error('Error fetching from IPFS:', error)
    throw error
  }
}
