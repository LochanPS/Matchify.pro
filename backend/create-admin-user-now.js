import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('🔧 Creating ADMIN user...\n');

  try {
    const password = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'ADMIN@gmail.com',
        phone: '9999999999',
        password: password,
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        roles: 'ADMIN,PLAYER,ORGANIZER,UMPIRE',
        isVerified: true,
        isActive: true,
        totalPoints: 0,
        tournamentsPlayed: 0,
        matchesWon: 0,
        matchesLost: 0
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📧 Email: ADMIN@gmail.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Name: Super Admin');
    console.log(`🆔 ID: ${admin.id}`);
    console.log('');
    console.log('✅ You can now use "Return to Admin" button!');

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Admin user already exists!');
      const existing = await prisma.user.findUnique({
        where: { email: 'ADMIN@gmail.com' }
      });
      console.log(`🆔 Existing admin ID: ${existing.id}`);
    } else {
      console.error('❌ Error:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
