import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function verifyAdminUser() {
  try {
    console.log('🔍 Checking admin user...\n');

    const admin = await prisma.user.findUnique({
      where: { email: 'ADMIN@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        password: true,
        createdAt: true
      }
    });

    if (!admin) {
      console.log('❌ Admin user not found in database');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('   ID:', admin.id);
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Roles:', admin.roles);
    console.log('   Created:', admin.createdAt);
    console.log('');

    // Test password
    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, admin.password);
    
    if (isValid) {
      console.log('✅ Password "admin123" is correct');
    } else {
      console.log('❌ Password "admin123" does NOT match');
      console.log('⚠️  Need to update password hash');
    }

    console.log('\n✅ Verification complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminUser();
