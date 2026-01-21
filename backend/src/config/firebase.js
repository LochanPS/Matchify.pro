// Firebase configuration - completely optional and safe
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let admin = null;
let isInitialized = false;

// Completely safe Firebase initialization
function initializeFirebase() {
  try {
    // Only try to load Firebase if we're in development or have explicit config
    if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_ENABLED !== 'true') {
      console.log('⚠️  Firebase disabled in production (set FIREBASE_ENABLED=true to enable)');
      return false;
    }

    const firebaseAdmin = require('firebase-admin');
    const serviceAccountPath = join(__dirname, '../../firebase-service-account.json');

    if (existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      
      // Check if Firebase is already initialized
      try {
        admin = firebaseAdmin.app();
        console.log('✅ Firebase already initialized');
        isInitialized = true;
        return true;
      } catch (error) {
        // Not initialized yet, initialize now
        admin = firebaseAdmin.initializeApp({
          credential: firebaseAdmin.credential.cert(serviceAccount)
        });
        isInitialized = true;
        console.log('✅ Firebase initialized successfully');
        return true;
      }
    } else {
      console.log('⚠️  Firebase service account file not found - Firebase disabled');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Firebase initialization failed:', error.message);
    return false;
  }
}

// Try to initialize Firebase (but don't crash if it fails)
initializeFirebase();

// Completely safe exports that will NEVER crash
const safeFirebase = {
  // Safe auth function
  auth: () => {
    try {
      if (!isInitialized || !admin) {
        return null;
      }
      return admin.auth();
    } catch (error) {
      console.log('⚠️  Firebase auth not available:', error.message);
      return null;
    }
  },

  // Safe messaging function
  messaging: () => {
    try {
      if (!isInitialized || !admin) {
        return null;
      }
      return admin.messaging();
    } catch (error) {
      console.log('⚠️  Firebase messaging not available:', error.message);
      return null;
    }
  },

  // Check if Firebase is available
  isAvailable: () => {
    return isInitialized && admin !== null;
  },

  // Safe admin access
  getAdmin: () => {
    try {
      if (!isInitialized || !admin) {
        return null;
      }
      return admin;
    } catch (error) {
      console.log('⚠️  Firebase admin not available:', error.message);
      return null;
    }
  }
};

// Export safe Firebase interface
export default safeFirebase;

// Named exports for backward compatibility
export const auth = safeFirebase.auth;
export const messaging = safeFirebase.messaging;
export const isAvailable = safeFirebase.isAvailable;
export const getAdmin = safeFirebase.getAdmin;
export { admin, isInitialized };

