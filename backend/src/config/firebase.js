// Firebase is optional - app works without it
// This file prevents crashes if firebase-admin is installed but not configured

let admin = null;

try {
  // Try to import firebase-admin if it exists
  const firebaseAdmin = require('firebase-admin');
  
  // Check if service account file exists
  const fs = require('fs');
  const path = require('path');
  const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    
    admin = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount)
    });
    
    console.log('✅ Firebase initialized successfully');
  } else {
    console.log('⚠️  Firebase service account not found - Firebase features disabled');
  }
} catch (error) {
  console.log('⚠️  Firebase not configured - Firebase features disabled');
}

// Export admin (will be null if not configured)
module.exports = admin;

// Export auth function that returns null if not configured
module.exports.auth = () => {
  if (admin) {
    return admin.auth();
  }
  return null;
};
