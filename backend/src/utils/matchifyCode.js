import prisma from '../lib/prisma.js';

/**
 * Generate sequential Matchify code
 * Format: #1, #2, #3, #4, ... (hashtag + sequential integer, no letters, no padding)
 * First user → #1, second → #2, hundredth → #100, etc.
 */
export async function generateMatchifyCode() {
  const maxRetries = 10;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Find the highest existing numeric matchify code
      const allCodes = await prisma.user.findMany({
        where: {
          matchifyCode: { not: null }
        },
        select: { matchifyCode: true }
      });

      let maxNum = 0;
      for (const { matchifyCode } of allCodes) {
        // Support both old format (#A10000) and new format (#1, #2, ...)
        const match = matchifyCode.match(/^#(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }

      const newCode = `#${maxNum + 1}`;

      // Race condition protection — ensure unique
      const existing = await prisma.user.findUnique({
        where: { matchifyCode: newCode }
      });

      if (!existing) {
        return newCode;
      }

      // Rare: another request generated same code; retry
      console.log(`Code ${newCode} already exists, retrying...`);

    } catch (error) {
      console.error(`Error generating matchify code (attempt ${attempt + 1}):`, error);
      if (attempt === maxRetries - 1) throw error;
    }
  }

  throw new Error('Failed to generate unique matchify code after maximum retries');
}

/**
 * Validate matchify code format
 * Accepts new format: #1, #12, #100, ...
 * Also accepts old format: #A10000 (backward compat for existing users)
 */
export function isValidMatchifyCode(code) {
  if (!code) return false;
  // New format: # followed by 1+ digits
  if (/^#\d+$/.test(code)) return true;
  // Old format: # + 1 letter + 5 digits (backward compat)
  if (/^#[A-Z]\d{5}$/i.test(code)) return true;
  return false;
}

/**
 * Normalize matchify code (add # if missing, trim whitespace)
 * No uppercase needed for pure-digit codes but kept for old format compat.
 */
export function normalizeMatchifyCode(code) {
  if (!code) return null;
  code = code.trim();
  if (!code.startsWith('#')) {
    code = '#' + code;
  }
  return code;
}

/**
 * Find user by matchify code (supports both old and new format)
 */
export async function findUserByMatchifyCode(code) {
  if (!code) return null;

  const normalizedCode = normalizeMatchifyCode(code);

  if (!isValidMatchifyCode(normalizedCode)) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { matchifyCode: normalizedCode }
  });

  return user;
}
