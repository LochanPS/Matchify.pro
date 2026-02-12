import jwt from 'jsonwebtoken';
import prisma from './src/lib/prisma.js';

async function checkAdminToken() {
  try {
    console.log('🔍 Checking admin user and token format...\n');

    // Check admin user in database
    const admin = await prisma.user.findUnique({
      where: { email: 'ADMIN@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true
      }
    });

    if (!admin) {
      console.log('❌ Admin user not found in database');
      return;
    }

    console.log('✅ Admin user in database:');
    console.log('   ID:', admin.id);
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Roles:', admin.roles);
    console.log('   Roles type:', typeof admin.roles);
    console.log('');

    // Generate a test token like the login would
    const adminRoles = admin.roles ? (typeof admin.roles === 'string' ? admin.roles.split(',') : admin.roles) : ['ADMIN'];
    
    const testToken = jwt.sign(
      { userId: admin.id, email: admin.email, roles: adminRoles, isAdmin: true },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('🔑 Test token generated');
    console.log('');

    // Decode it to show what it contains
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET || 'your-secret-key');
    console.log('📦 Token payload:');
    console.log('   userId:', decoded.userId);
    console.log('   email:', decoded.email);
    console.log('   roles:', decoded.roles);
    console.log('   isAdmin:', decoded.isAdmin);
    console.log('');

    // Show what should be stored in localStorage
    const userObject = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      roles: adminRoles,
      isAdmin: true
    };

    console.log('💾 User object for localStorage:');
    console.log(JSON.stringify(userObject, null, 2));
    console.log('');

    console.log('✅ Everything looks correct!');
    console.log('');
    console.log('🔧 If dashboard still redirects to login:');
    console.log('   1. Open browser console (F12)');
    console.log('   2. Type: localStorage.getItem("user")');
    console.log('   3. Check if roles is an array: ["ADMIN"]');
    console.log('   4. If not, logout and login again');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminToken();
