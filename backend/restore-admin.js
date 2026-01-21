import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function restoreAdmin() {
  try {
    console.log('🔧 Restoring admin account with correct credentials...\n');

    // Hash the correct password
    const correctPassword = await bcrypt.hash('ADMIN@123(123)', 12);

    // Find existing admin by phone or email
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@matchify.pro' },
          { phone: '+919876543214' },
          { roles: { contains: 'ADMIN' } }
        ]
      }
    });

    let admin;
    if (existingAdmin) {
      // Update existing admin
      admin = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          email: 'ADMIN@gmail.com',
          password: correctPassword,
          name: 'Admin User',
          roles: 'ADMIN',
        },
      });
      console.log('✅ Existing admin account updated!');
    } else {
      // Create new admin
      admin = await prisma.user.create({
        data: {
          email: 'ADMIN@gmail.com',
          password: correctPassword,
          name: 'Admin User',
          roles: 'ADMIN',
          phone: '+919876543214',
          city: 'Bangalore',
          state: 'Karnataka',
        },
      });
      console.log('✅ New admin account created!');
    }

    console.log('\n📧 Email:', admin.email);
    console.log('🔑 Password: ADMIN@123(123)');
    console.log('👤 Name:', admin.name);
    console.log('🎭 Roles:', admin.roles);

    // Update organizer account
    const existingOrganizer = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'organizer1@test.com' },
          { email: 'organizer@gmail.com' },
          { phone: '+919876543212' }
        ]
      }
    });

    let organizer;
    if (existingOrganizer) {
      organizer = await prisma.user.update({
        where: { id: existingOrganizer.id },
        data: {
          email: 'organizer@gmail.com',
          password: await bcrypt.hash('organizer123', 12),
          name: 'Test Organizer',
          roles: 'ORGANIZER',
        },
      });
      console.log('\n✅ Existing organizer account updated!');
    } else {
      organizer = await prisma.user.create({
        data: {
          email: 'organizer@gmail.com',
          password: await bcrypt.hash('organizer123', 12),
          name: 'Test Organizer',
          roles: 'ORGANIZER',
          phone: '+919876543215',
          city: 'Mumbai',
          state: 'Maharashtra',
        },
      });
      console.log('\n✅ New organizer account created!');
    }

    console.log('📧 Email:', organizer.email);
    console.log('🔑 Password: organizer123');

    console.log('\n🎉 All accounts restored successfully!');
    console.log('\nYou can now login with:');
    console.log('Admin: ADMIN@gmail.com / ADMIN@123(123)');
    console.log('Organizer: organizer@gmail.com / organizer123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAdmin();
