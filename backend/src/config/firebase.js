import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let admin = null;
let isInitialized = false;

function initializeFirebase() {
  try {
    // Disable in production unless explicitly enabled
    if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_ENABLED !== 'true') {
      console.log('⚠️  Firebase disabled in production');
      return false;
    }

    const firebaseAdmin = require('firebase-admin');
    const serviceAccountPath = join(__dirname, '../../firebase-service-account.json');

    if (existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount)
      });
      isInitialized = true;
      console.log('✅ Firebase initialized');
      return true;
    } else {
      console.log('⚠️  Firebase service account not found - disabled');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Firebase initialization failed:', error.message);
    return false;
  }
}

initializeFirebase();

// Safe exports that never crash
export default {
  auth: () => {
    try {
      if (!isInitialized || !admin) return null;
      return admin.auth();
    } catch (error) {
      return null;
    }
  },
  messaging: () => {
    try {
      if (!isInitialized || !admin) return null;
      return admin.messaging();
    } catch (error) {
      return null;
    }
  },
  isAvailable: () => isInitialized && admin !== null,
  getAdmin: () => {
    try {
      if (!isInitialized || !admin) return null;
      return admin;
    } catch (error) {
      return null;
    }
  }
};
