let admin = null;

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
    console.log('✅ Firebase initialized');
  } else {
    console.log('⚠️  Firebase not configured - service account file not found');
  }
} catch (error) {
  console.log('⚠️  Firebase disabled:', error.message);
}

module.exports = admin;
module.exports.auth = () => admin ? admin.auth() : null;
