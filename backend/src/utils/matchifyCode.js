import prisma from '../lib/prisma.js';

/**
 * Generate sequential Matchify code
 * Format: #A10000, #A10001, #A10002, ..., #A99999, #B10000, ...
 * 
 * Logic:
 * - Starts at #A10000
 * - Increments sequentially
 * - When reaches #A99999, moves to #B10000
 * - Pattern: #[A-Z][10000-99999]
 */
export async function generateMatchifyCode() {
  const maxRetries = 10;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get the latest matchify code from database
      const latestUser = await prisma.user.findFirst({
        where: {
          matchifyCode: {
            not: null
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          matchifyCode: true
        }
      });

      let newCode;
      
      if (!latestUser || !latestUser.matchifyCode) {
        // First user - start with #A10000
        newCode = '#A10000';
      } else {
        // Parse the latest code
        const latestCode = latestUser.matchifyCode;
        const letter = latestCode.charAt(1); // Get letter (A, B, C, etc.)
        const number = parseInt(latestCode.substring(2)); // Get number (10000, 10001, etc.)
        
        if (number < 99999) {
          // Increment number
          newCode = `#${letter}${(number + 1).toString().padStart(5, '0')}`;
        } else {
          // Move to next letter
          const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
          if (nextLetter > 'Z') {
            throw new Error('Matchify code limit reached (Z99999)');
          }
          newCode = `#${nextLetter}10000`;
        }
      }

      // Check if code already exists (race condition protection)
      const existing = await prisma.user.findUnique({
        where: { matchifyCode: newCode }
      });

      if (!existing) {
        return newCode;
      }

      // If code exists, retry (should be rare)
      console.log(`Code ${newCode} already exists, retrying...`);
      
    } catch (error) {
      console.error(`Error generating matchify code (attempt ${attempt + 1}):`, error);
      if (attempt === maxRetries - 1) {
        throw error;
      }
    }
  }

  throw new Error('Failed to generate unique matchify code after maximum retries');
}

/**
 * Validate matchify code format
 * @param {string} code - Code to validate
 * @returns {boolean} - True if valid
 */
export function isValidMatchifyCode(code) {
  if (!code) return false;
  
  // Format: #[A-Z][10000-99999]
  const regex = /^#[A-Z]([1-9][0-9]{4})$/;
  
  if (!regex.test(code)) return false;
  
  // Extract number and validate range
  const number = parseInt(code.substring(2));
  return number >= 10000 && number <= 99999;
}

/**
 * Normalize matchify code (add # if missing)
 * @param {string} code - Code to normalize
 * @returns {string} - Normalized code
 */
export function normalizeMatchifyCode(code) {
  if (!code) return null;
  
  // Remove spaces and convert to uppercase
  code = code.trim().toUpperCase();
  
  // Add # if missing
  if (!code.startsWith('#')) {
    code = '#' + code;
  }
  
  return code;
}

/**
 * Find user by matchify code
 * @param {string} code - Matchify code (with or without #)
 * @returns {Promise<User|null>} - User object or null
 */
export async function findUserByMatchifyCode(code) {
  if (!code) return null;
  
  // Normalize code
  const normalizedCode = normalizeMatchifyCode(code);
  
  // Validate format
  if (!isValidMatchifyCode(normalizedCode)) {
    return null;
  }
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { matchifyCode: normalizedCode }
  });
  
  return user;
}
