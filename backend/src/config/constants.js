/**
 * Platform-wide constants — single source of truth.
 * Override via environment variables in production.
 */

// Platform fee charged on tournament revenue (percentage)
export const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT) || 3;
