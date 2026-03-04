import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserRoles() {
  try {
    console.log('🔄 Updating user roles...');

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

    console.log(`Found ${users.length} users to update`);

    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      const currentRoles = user.roles || '';
      
      // Skip if user already has all three roles
      if (currentRoles.includes('PLAYER') && 
          currentRoles.includes('ORGANIZER') && 
          currentRoles.includes('UMPIRE')) {
        console.log(`✓ User ${user.email} already has all roles`);
        skipped++;
        continue;
      }

      // Update to have all three roles
      await prisma.user.update({
        where: { id: user.id },
        data: {
          roles: 'PLAYER,ORGANIZER,UMPIRE'
        }
      });

      console.log(`✅ Updated ${user.email} from "${currentRoles}" to "PLAYER,ORGANIZER,UMPIRE"`);
      updated++;
    }

    console.log('\n📊 Summary:');
    console.log(`   Updated: ${updated} users`);
    console.log(`   Skipped: ${skipped} users`);
    console.log(`   Total: ${users.length} users`);
    console.log('\n✅ All users now have PLAYER, ORGANIZER, and UMPIRE roles!');

  } catch (error) {
    console.error('❌ Error updating user roles:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserRoles();
