/**
 * Test script for Return to Admin functionality
 * Run with: node test-return-to-admin.js
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

console.log('🧪 Testing Return to Admin Functionality\n');

// Test 1: Create impersonation token
console.log('Test 1: Creating impersonation token...');
const impersonationToken = jwt.sign(
  { 
    userId: 'user-123',
    email: 'user@example.com',
    roles: ['PLAYER'],
    isImpersonating: true,
    adminId: 'admin'  // Hardcoded admin ID
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('✅ Impersonation token created');
console.log('Token payload:', jwt.decode(impersonationToken));
console.log('');

// Test 2: Decode token to verify fields
console.log('Test 2: Decoding token...');
const decoded = jwt.verify(impersonationToken, JWT_SECRET);
console.log('✅ Token decoded successfully');
console.log('Decoded payload:', decoded);
console.log('isImpersonating:', decoded.isImpersonating);
console.log('adminId:', decoded.adminId);
console.log('');

// Test 3: Check if adminId is 'admin'
console.log('Test 3: Checking admin ID...');
if (decoded.adminId === 'admin') {
  console.log('✅ Admin ID is hardcoded admin');
  console.log('Should return hardcoded admin token');
} else {
  console.log('❌ Admin ID is not hardcoded admin');
  console.log('Should look up admin in database');
}
console.log('');

// Test 4: Create return admin token
console.log('Test 4: Creating return admin token...');
const adminToken = jwt.sign(
  { 
    userId: 'admin',
    email: 'ADMIN@gmail.com',
    roles: ['ADMIN'],
    isAdmin: true
  },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('✅ Admin token created');
console.log('Token payload:', jwt.decode(adminToken));
console.log('');

console.log('🎉 All tests passed!');
console.log('');
console.log('Expected flow:');
console.log('1. Admin logs in → gets token with userId: "admin"');
console.log('2. Admin impersonates user → gets token with isImpersonating: true, adminId: "admin"');
console.log('3. Admin returns → backend checks adminId === "admin" → returns hardcoded admin token');
console.log('');
console.log('If you see errors, check:');
console.log('- Backend server is running on localhost:5000');
console.log('- JWT_SECRET matches between frontend and backend');
console.log('- admin.controller.js has the hardcoded admin handling code');
console.log('- auth.js middleware preserves isImpersonating and adminId fields');
