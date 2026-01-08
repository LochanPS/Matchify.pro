import crypto from 'crypto';

/**
 * Generate a random one-time password (8 characters, alphanumeric)
 * Format: A1B2C3D4 (uppercase letters and numbers)
 */
export function generateOneTimePassword() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Calculate expiry date based on duration
 * @param {string} duration - '24h', '7d', or '30d'
 * @returns {Date} Expiry date
 */
export function calculateExpiry(duration = '7d') {
  const now = new Date();
  const durations = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  
  const ms = durations[duration] || durations['7d'];
  return new Date(now.getTime() + ms);
}

/**
 * Generate a secure invite token
 * @returns {string} 64-character hex token
 */
export function generateInviteToken() {
  return crypto.randomBytes(32).toString('hex');
}
