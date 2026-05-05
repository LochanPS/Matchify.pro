import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdminName() {
  console.log('🔧 Updating admin user name...\n');

  try {
    const admin = await prisma.user.update({
      where: { email: 'ADMIN@gmail.com' },
      data: { name: 'Admin' }
    });

    console.log('✅ Admin name updated successfully!');
    console.log('');
    console.log('📧 Email:', admin.email);
    console.log('👤 New Name:', admin.name);
    console.log('🆔 ID:', admin.id);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminName()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
