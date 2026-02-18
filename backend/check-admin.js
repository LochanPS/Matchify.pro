import prisma from './src/lib/prisma.js';

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'ADMIN@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isActive: true,
        isVerified: true
      }
    });

    if (admin) {
      console.log('✅ Admin account found:');
      console.log(JSON.stringify(admin, null, 2));
    } else {
      console.log('❌ Admin account NOT found!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
