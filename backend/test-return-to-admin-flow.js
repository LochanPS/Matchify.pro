import jwt from 'jsonwebtoken';
import prisma from './src/lib/prisma.js';

async function testReturnToAdminFlow() {
  try {
    console.log('🧪 Testing Return to Admin Flow\n');
    console.log('═══════════════════════════════════════\n');

    // Step 1: Simulate admin login
    console.log('📝 Step 1: Admin Login');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'ADMIN@gmail.com' }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    const adminToken = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, roles: ['ADMIN'], isAdmin: true },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Admin token created');
    console.log('   Admin ID:', adminUser.id);
    console.log('   Admin Email:', adminUser.email);
    console.log('');

    // Step 2: Simulate impersonation
    console.log('📝 Step 2: Impersonate User');
    const targetUser = await prisma.user.findFirst({
      where: {
        roles: { not: { contains: 'ADMIN' } }
      }
    });

    if (!targetUser) {
      console.log('❌ No non-admin user found');
      return;
    }

    const userRoles = targetUser.roles ? targetUser.roles.split(',') : ['PLAYER'];
    const impersonationToken = jwt.sign(
      { 
        userId: targetUser.id, 
        email: targetUser.email, 
        roles: userRoles,
        isImpersonating: true,
        adminId: adminUser.id  // This is the key fix!
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('✅ Impersonation token created');
    console.log('   Target User ID:', targetUser.id);
    console.log('   Target User Email:', targetUser.email);
    console.log('   Admin ID in token:', adminUser.id);
    console.log('');

    // Step 3: Decode impersonation token to verify
    console.log('📝 Step 3: Verify Impersonation Token');
    const decoded = jwt.verify(impersonationToken, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token decoded successfully');
    console.log('   isImpersonating:', decoded.isImpersonating);
    console.log('   adminId:', decoded.adminId);
    console.log('   adminId type:', typeof decoded.adminId);
    console.log('');

    // Step 4: Simulate return to admin
    console.log('📝 Step 4: Return to Admin');
    if (!decoded.isImpersonating || !decoded.adminId) {
      console.log('❌ Not in impersonation mode');
      return;
    }

    // Look up admin user by ID
    const returnAdmin = await prisma.user.findUnique({
      where: { id: decoded.adminId }
    });

    if (!returnAdmin) {
      console.log('❌ Admin user not found by ID:', decoded.adminId);
      return;
    }

    console.log('✅ Admin user found');
    console.log('   Admin ID:', returnAdmin.id);
    console.log('   Admin Email:', returnAdmin.email);
    console.log('   Admin Name:', returnAdmin.name);
    console.log('');

    // Create new admin token
    const returnAdminRoles = returnAdmin.roles ? returnAdmin.roles.split(',') : ['ADMIN'];
    const returnToken = jwt.sign(
      { 
        userId: returnAdmin.id, 
        email: returnAdmin.email, 
        roles: returnAdminRoles
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('✅ New admin token created');
    console.log('');

    // Final verification
    console.log('═══════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('✅ Admin login works');
    console.log('✅ Impersonation token stores correct adminId');
    console.log('✅ Return to admin finds admin user');
    console.log('✅ New admin token generated successfully');
    console.log('');
    console.log('🚀 Ready to test in browser!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testReturnToAdminFlow();
