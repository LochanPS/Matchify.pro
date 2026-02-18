import jwt from 'jsonwebtoken';

// Test token generation
const testUser = {
  userId: 'test-123',
  email: 'test@test.com',
  roles: ['PLAYER', 'ORGANIZER', 'UMPIRE']
};

const token = jwt.sign(testUser, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

console.log('Generated Token:', token);
console.log('\nDecoded Token:', jwt.decode(token));

// Test verification
try {
  const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  console.log('\n✅ Token verified successfully:', verified);
} catch (error) {
  console.log('\n❌ Token verification failed:', error.message);
}
