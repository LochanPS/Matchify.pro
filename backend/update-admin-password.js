import prisma from './src/lib/prisma.js';
import bcrypt from 'bcrypt';

async function updateAdminPassword() {
  try {
    console.log('🔄 Updating admin password...\n');

    const adminEmail = 'ADMIN@gmail.com';
    const newPassword = 'ADMIN@123(123)';

    // Find admin
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!admin) {
      console.log('❌ Admin user not found!');
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword
      }
    });

    console.log('✅ Admin password updated successfully!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   New Password: ${newPassword}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
