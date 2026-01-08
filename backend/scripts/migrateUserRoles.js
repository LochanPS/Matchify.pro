import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUserRoles() {
  try {
    console.log('🔄 Migrating user roles...');

    // Get all users
    const users = await prisma.user.findMany();

    for (const user of users) {
      // Convert single role to roles array format
      let roles = 'PLAYER'; // Default
      
      if (user.roles) {
        // If roles already exists, keep it
        roles = user.roles;
      } else {
        // This shouldn't happen since we set default, but just in case
        roles = 'PLAYER';
      }

      // Create profile based on role
      const roleArray = roles.split(',');

      if (roleArray.includes('PLAYER')) {
        try {
          await prisma.playerProfile.create({
            data: {
              userId: user.id,
              matchifyPoints: user.totalPoints || 0,
              tournamentsPlayed: user.tournamentsPlayed || 0,
              matchesWon: user.matchesWon || 0,
              matchesLost: user.matchesLost || 0,
            },
          });
          console.log(`✅ Created PlayerProfile for ${user.email}`);
        } catch (error) {
          if (error.code !== 'P2002') { // Ignore unique constraint errors
            console.error(`❌ Error creating PlayerProfile for ${user.email}:`, error.message);
          }
        }
      }

      if (roleArray.includes('ORGANIZER')) {
        try {
          await prisma.organizerProfile.create({
            data: {
              userId: user.id,
            },
          });
          console.log(`✅ Created OrganizerProfile for ${user.email}`);
        } catch (error) {
          if (error.code !== 'P2002') {
            console.error(`❌ Error creating OrganizerProfile for ${user.email}:`, error.message);
          }
        }
      }

      if (roleArray.includes('UMPIRE')) {
        try {
          await prisma.umpireProfile.create({
            data: {
              userId: user.id,
            },
          });
          console.log(`✅ Created UmpireProfile for ${user.email}`);
        } catch (error) {
          if (error.code !== 'P2002') {
            console.error(`❌ Error creating UmpireProfile for ${user.email}:`, error.message);
          }
        }
      }
    }

    console.log('✨ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateUserRoles();