// Test Firebase configuration safety
console.log('🧪 Testing Firebase configuration safety...');

// Set production environment to test the safety
process.env.NODE_ENV = 'production';
process.env.FIREBASE_ENABLED = 'false';

try {
  // Import Firebase config
  const firebase = await import('./src/config/firebase.js');
  
  console.log('✅ Firebase config imported successfully');
  
  // Test all methods
  const auth = firebase.default.auth();
  console.log('✅ Firebase auth() called:', auth === null ? 'null (safe)' : 'initialized');
  
  const messaging = firebase.default.messaging();
  console.log('✅ Firebase messaging() called:', messaging === null ? 'null (safe)' : 'initialized');
  
  const isAvailable = firebase.default.isAvailable();
  console.log('✅ Firebase isAvailable():', isAvailable);
  
  const admin = firebase.default.getAdmin();
  console.log('✅ Firebase getAdmin():', admin === null ? 'null (safe)' : 'initialized');
  
  console.log('🎉 All Firebase methods are safe and won\'t crash!');
  
} catch (error) {
  console.error('❌ Firebase config test failed:', error.message);
  process.exit(1);
}

console.log('✅ Firebase safety test completed successfully!');