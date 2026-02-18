import prisma from './src/lib/prisma.js';

async function fixAllUserRoles() {
  try {
    console.log('🔄 Fixing all user roles...\n');

    // Get all non-admin users
    const users = await prisma.user.findMany({
      where: {
        NOT: {
          roles: {
            contains: 'ADMIN'
          }
        }
      }
    });

    console.log(`Found ${users.length} non-admin users\n`);

    for (const user of users) {
      const currentRoles = user.roles || '';
      const rolesArray = currentRoles.split(',').map(r => r.trim()).filter(r => r);
      
      console.log(`📧 ${user.email}`);
      console.log(`   Current roles: ${currentRoles}`);
      
      // Check if user has all 3 roles
      const hasPlayer = rolesArray.includes('PLAYER');
      const hasOrganizer = rolesArray.includes('ORGANIZER');
      const hasUmpire = rolesArray.includes('UMPIRE');
      
      if (hasPlayer && hasOrganizer && hasUmpire) {
        console.log(`   ✅ Already has all roles\n`);
        continue;
      }
      
      // Update to have all 3 roles
      await prisma.user.update({
        where: { id: user.id },
        data: {
          roles: 'PLAYER,ORGANIZER,UMPIRE'
        }
      });
      
      // Create missing profiles
      if (!hasPlayer) {
        const existingProfile = await prisma.playerProfile.findUnique({
          where: { userId: user.id }
        });
        if (!existingProfile) {
          await prisma.playerProfile.create({
            data: { userId: user.id }
          });
        }
      }
      
      if (!hasOrganizer) {
        const existingProfile = await prisma.organizerProfile.findUnique({
          where: { userId: user.id }
        });
        if (!existingProfile) {
          await prisma.organizerProfile.create({
            data: { userId: user.id }
          });
        }
      }
      
      if (!hasUmpire) {
        const existingProfile = await prisma.umpireProfile.findUnique({
          where: { userId: user.id }
        });
        if (!existingProfile) {
          await prisma.umpireProfile.create({
            data: { userId: user.id }
          });
        }
      }
      
      console.log(`   ✅ Updated to: PLAYER,ORGANIZER,UMPIRE\n`);
    }

    console.log('✅ All users updated!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllUserRoles();
