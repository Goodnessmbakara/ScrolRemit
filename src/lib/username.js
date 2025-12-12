/**
 * Username Utilities
 * 
 * Centralized username validation and sanitization to ensure consistency
 * across profile creation, payment flows, and all username handling.
 */

// Username format rules:
// - Lowercase letters (a-z)
// - Numbers (0-9)
// - Dots (.)
// - Hyphens (-)
// - Underscores (_)
// - Length: 3-30 characters
// - Cannot start or end with dot or hyphen
// - No consecutive dots or hyphens

export const USERNAME_CONFIG = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 30,
  // Allowed characters regex (for validation after sanitization)
  ALLOWED_CHARS: /^[a-z0-9._-]+$/,
  // Strict format: no leading/trailing/consecutive dots or hyphens
  STRICT_FORMAT: /^[a-z0-9][a-z0-9._-]*[a-z0-9]$|^[a-z0-9]$/,
}

/**
 * Sanitize a display name into a valid username
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes invalid characters
 * - Removes consecutive dots/hyphens
 * - Trims leading/trailing dots/hyphens
 * 
 * @param {string} displayName - User's display name
 * @returns {string} Sanitized username
 */
export function sanitizeUsername(displayName) {
  if (!displayName) return ''
  
  return displayName
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove any character that's not allowed
    .replace(/[^a-z0-9._-]/g, '')
    // Replace consecutive dots or hyphens with single one
    .replace(/\.{2,}/g, '.')
    .replace(/-{2,}/g, '-')
    // Remove leading dots/hyphens
    .replace(/^[.-]+/, '')
    // Remove trailing dots/hyphens
    .replace(/[.-]+$/, '')
}

/**
 * Validate username format
 * 
 * @param {string} username - Username to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateUsername(username) {
  if (!username || username.trim() === '') {
    return {
      valid: false,
      error: 'Username is required'
    }
  }
  
  const trimmed = username.trim()
  
  // Check length
  if (trimmed.length < USERNAME_CONFIG.MIN_LENGTH) {
    return {
      valid: false,
      error: `Username must be at least ${USERNAME_CONFIG.MIN_LENGTH} characters`
    }
  }
  
  if (trimmed.length > USERNAME_CONFIG.MAX_LENGTH) {
    return {
      valid: false,
      error: `Username must be at most ${USERNAME_CONFIG.MAX_LENGTH} characters`
    }
  }
  
  // Check allowed characters
  if (!USERNAME_CONFIG.ALLOWED_CHARS.test(trimmed)) {
    return {
      valid: false,
      error: 'Username can only contain lowercase letters, numbers, dots, hyphens, and underscores'
    }
  }
  
  // Check strict format (no leading/trailing/consecutive dots or hyphens)
  if (!USERNAME_CONFIG.STRICT_FORMAT.test(trimmed)) {
    return {
      valid: false,
      error: 'Username cannot start/end with dots or hyphens, and cannot have consecutive dots or hyphens'
    }
  }
  
  return { valid: true }
}

/**
 * Clean username by removing @ prefix if present
 * 
 * @param {string} username - Username with or without @ prefix
 * @returns {string} Clean username without @ prefix
 */
export function cleanUsername(username) {
  if (!username) return ''
  return username.trim().startsWith('@') ? username.trim().slice(1) : username.trim()
}

/**
 * Format username with @ prefix for display
 * 
 * @param {string} username - Username
 * @returns {string} Username with @ prefix
 */
export function formatUsername(username) {
  if (!username) return ''
  const clean = cleanUsername(username)
  return clean ? `@${clean}` : ''
}

/**
 * Get preview of what username will become after sanitization
 * Useful for showing users what their username will look like
 * 
 * @param {string} displayName - Display name input
 * @returns {{username: string, changed: boolean, valid: boolean, error?: string}}
 */
export function getUsernamePreview(displayName) {
  const sanitized = sanitizeUsername(displayName)
  const validation = validateUsername(sanitized)
  
  return {
    username: sanitized,
    changed: displayName.toLowerCase() !== sanitized,
    valid: validation.valid,
    error: validation.error
  }
}

/**
 * Reserved usernames that cannot be registered
 */
export const RESERVED_USERNAMES = [
  'admin',
  'api',
  'root',
  'system',
  'moderator',
  'support',
  'help',
  'official',
  'staff',
  'team',
  'bot',
  'scrol',
  'scrolremit',
  'scroll'
]

/**
 * Check if username is reserved
 * 
 * @param {string} username - Username to check
 * @returns {boolean} True if reserved
 */
export function isReservedUsername(username) {
  const clean = cleanUsername(username).toLowerCase()
  return RESERVED_USERNAMES.includes(clean)
}
