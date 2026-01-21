let admin = null;
let isInitialized = false;

try {
  const firebaseAdmin = require('firebase-admin');
  const fs = require('fs');
  const path = require('path');

  const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount)
    });
    isInitialized = true;
    console.log('✅ Firebase initialized');
  } else {
    console.log('⚠️  Firebase not configured - service account file not found');
  }
} catch (error) {
  console.log('⚠️  Firebase disabled:', error.message);
}

// Safe exports that won't crash if Firebase isn't initialized
const safeAdmin = {
  auth: () => {
    if (!isInitialized || !admin) {
      return null;
    }
    try {
      return admin.auth();
    } catch (error) {
      console.log('⚠️  Firebase auth not available');
      return null;
    }
  },
  messaging: () => {
    if (!isInitialized || !admin) {
      return null;
    }
    try {
      return admin.messaging();
    } catch (error) {
      console.log('⚠️  Firebase messaging not available');
      return null;
    }
  }
};

module.exports = safeAdmin;
module.exports.admin = admin;
module.exports.isInitialized = isInitialized;

