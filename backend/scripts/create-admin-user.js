import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...\n');

    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'ADMIN@gmail.com' }
    });

    if (existing) {
      console.log('✅ Admin user already exists');
      console.log('Email:', existing.email);
      console.log('Roles:', existing.roles);
      
      // Update roles to include ORGANIZER if not present
      const roles = existing.roles.split(',').map(r => r.trim());
      if (!roles.includes('ORGANIZER')) {
        const newRoles = [...roles, 'ORGANIZER'].join(',');
        await prisma.user.update({
          where: { id: existing.id },
          data: { roles: newRoles }
        });
        console.log('✅ Added ORGANIZER role');
        console.log('New roles:', newRoles);
      }
      
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'ADMIN@gmail.com',
        password: hashedPassword,
        name: 'Admin',
        roles: 'ADMIN,PLAYER,UMPIRE,ORGANIZER', // All roles
        phone: '+919999999999',
        isVerified: true,
        isVerifiedOrganizer: true,
        isVerifiedPlayer: true,
        isVerifiedUmpire: true,
      }
    });

    // Create profiles
    await Promise.all([
      prisma.playerProfile.create({
        data: { userId: admin.id }
      }),
      prisma.umpireProfile.create({
        data: { userId: admin.id }
      }),
      prisma.organizerProfile.create({
        data: { userId: admin.id }
      })
    ]);

    console.log('✅ Admin user created successfully!');
    console.log('\nLogin Details:');
    console.log('Email: ADMIN@gmail.com');
    console.log('Password: admin123');
    console.log('Roles:', admin.roles);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
