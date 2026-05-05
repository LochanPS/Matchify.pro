import prisma from './src/lib/prisma.js';

async function fixAdminRoles() {
  try {
    console.log('🔧 Fixing admin user roles...');
    
    // Update admin to ONLY have ADMIN role
    const admin = await prisma.user.update({
      where: { email: 'ADMIN@gmail.com' },
      data: {
        roles: 'ADMIN' // ONLY admin role, no player/organizer/umpire
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isActive: true
      }
    });

    console.log('✅ Admin roles updated successfully:');
    console.log(JSON.stringify(admin, null, 2));
    console.log('\n✅ Admin now has ONLY admin role - no player/organizer/umpire features!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRoles();
