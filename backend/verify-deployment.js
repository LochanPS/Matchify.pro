#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Run this before deploying to ensure all environment variables are configured
 */

import dotenv from 'dotenv';
import colors from 'colors';

// Load environment variables
dotenv.config();

const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
  'CORS_ORIGIN',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const OPTIONAL_VARS = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'SENDGRID_API_KEY',
  'NODE_ENV',
  'PORT'
];

console.log('\n' + '='.repeat(70));
console.log(colors.cyan.bold('🔍 MATCHIFY.PRO DEPLOYMENT VERIFICATION'));
console.log('='.repeat(70) + '\n');

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log(colors.bold('REQUIRED ENVIRONMENT VARIABLES:'));
REQUIRED_VARS.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(colors.red(`  ✗ ${varName} - MISSING`));
    hasErrors = true;
  } else {
    console.log(colors.green(`  ✓ ${varName} - Configured`));
  }
});

console.log('');

// Check optional variables
console.log(colors.bold('OPTIONAL ENVIRONMENT VARIABLES:'));
OPTIONAL_VARS.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(colors.yellow(`  ⚠ ${varName} - Not configured (optional)`));
    hasWarnings = true;
  } else {
    console.log(colors.green(`  ✓ ${varName} - Configured`));
  }
});

console.log('\n' + '='.repeat(70));

if (hasErrors) {
  console.log(colors.red.bold('\n❌ DEPLOYMENT VERIFICATION FAILED'));
  console.log(colors.red('Missing required environment variables. Please configure them before deploying.\n'));
  console.log(colors.yellow('To fix:'));
  console.log(colors.yellow('1. Go to Vercel Dashboard'));
  console.log(colors.yellow('2. Settings → Environment Variables'));
  console.log(colors.yellow('3. Add the missing variables'));
  console.log(colors.yellow('4. Redeploy the application\n'));
  process.exit(1);
} else if (hasWarnings) {
  console.log(colors.yellow.bold('\n⚠️  DEPLOYMENT VERIFICATION PASSED WITH WARNINGS'));
  console.log(colors.yellow('Some optional features may not work without the missing variables.\n'));
  process.exit(0);
} else {
  console.log(colors.green.bold('\n✅ DEPLOYMENT VERIFICATION PASSED'));
  console.log(colors.green('All required environment variables are configured.\n'));
  process.exit(0);
}
