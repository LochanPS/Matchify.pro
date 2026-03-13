import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verifyAdminAccess() {
  try {
    console.log('🔍 Verifying Admin Access...\n');

    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'ADMIN@gmail.com' }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found!');
      console.log('Please run: node create-admin-user-now.js');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('   ID:', adminUser.id);
    console.log('   Email:', adminUser.email);
    console.log('   Name:', adminUser.name);
    console.log('   Roles:', adminUser.roles);
    console.log('   Is Active:', adminUser.isActive);
    console.log('   Is Verified:', adminUser.isVerified);
    console.log('   Is Suspended:', adminUser.isSuspended);

    // Check if roles include ADMIN
    const roles = adminUser.roles ? adminUser.roles.split(',') : [];
    if (roles.includes('ADMIN')) {
      console.log('\n✅ Admin has ADMIN role');
    } else {
      console.log('\n❌ Admin does NOT have ADMIN role');
      console.log('   Current roles:', roles);
    }

    // Check account status
    if (adminUser.isActive && adminUser.isVerified && !adminUser.isSuspended) {
      console.log('✅ Admin account is active and verified');
    } else {
      console.log('⚠️  Admin account has issues:');
      if (!adminUser.isActive) console.log('   - Account is not active');
      if (!adminUser.isVerified) console.log('   - Account is not verified');
      if (adminUser.isSuspended) console.log('   - Account is suspended');
    }

    console.log('\n📋 Login Credentials:');
    console.log('   Email: ADMIN@gmail.com');
    console.log('   Password: admin123');

    console.log('\n✅ Admin should now be able to access:');
    console.log('   - Dashboard (/dashboard)');
    console.log('   - Tournaments (/tournaments)');
    console.log('   - Leaderboard (/leaderboard)');
    console.log('   - Academies (/academies)');
    console.log('   - All Organizer pages');
    console.log('   - All Umpire pages');
    console.log('   - All Admin pages');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminAccess();
