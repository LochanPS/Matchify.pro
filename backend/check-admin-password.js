import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdminPassword() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'ADMIN@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        password: true
      }
    });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Roles:', admin.roles);
    console.log('   Password hash:', admin.password.substring(0, 20) + '...');

    // Test password
    const testPassword = 'ADMIN@123(123)';
    const isValid = await bcrypt.compare(testPassword, admin.password);
    console.log(`\n🔐 Password "${testPassword}" is ${isValid ? '✅ VALID' : '❌ INVALID'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPassword();
