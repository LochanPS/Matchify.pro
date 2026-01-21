import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addOrganizerRoleToAdmin() {
  try {
    console.log('🔍 Checking admin user...');
    
    const admin = await prisma.user.findUnique({
      where: { email: 'ADMIN@gmail.com' },
      select: { id: true, email: true, roles: true }
    });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('Current admin:', admin);

    // Check if admin already has ORGANIZER role
    const roles = admin.roles.split(',').map(r => r.trim());
    
    if (roles.includes('ORGANIZER')) {
      console.log('✅ Admin already has ORGANIZER role');
      return;
    }

    // Add ORGANIZER role
    const newRoles = [...roles, 'ORGANIZER'].join(',');
    
    await prisma.user.update({
      where: { id: admin.id },
      data: { roles: newRoles }
    });

    console.log('✅ ORGANIZER role added to admin!');
    console.log('New roles:', newRoles);

    // Create organizer profile if it doesn't exist
    const organizerProfile = await prisma.organizerProfile.findUnique({
      where: { userId: admin.id }
    });

    if (!organizerProfile) {
      await prisma.organizerProfile.create({
        data: {
          userId: admin.id
        }
      });
      console.log('✅ Organizer profile created for admin');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addOrganizerRoleToAdmin();
