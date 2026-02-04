import prisma from './src/lib/prisma.js';

async function register128Users() {
  try {
    console.log('🎾 Registering 128 users to ACE badminton tournament...\n');

    // Get the tournament
    const tournament = await prisma.tournament.findFirst({
      where: { name: 'ACE badminton tournament' },
      include: {
        categories: true
      }
    });

    if (!tournament) {
      console.log('❌ Tournament not found');
      return;
    }

    console.log(`✅ Found tournament: ${tournament.name}`);
    console.log(`   ID: ${tournament.id}`);
    console.log(`   Categories: ${tournament.categories.length}`);

    if (tournament.categories.length === 0) {
      console.log('❌ No categories found in tournament');
      return;
    }

    const category = tournament.categories[0];
    console.log(`   Using category: ${category.name} (${category.id})\n`);

    // Get all users (excluding admin and organizer)
    const users = await prisma.user.findMany({
      where: {
        roles: {
          not: {
            contains: 'ADMIN'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${users.length} users to register\n`);

    let registered = 0;
    let alreadyRegistered = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Check if already registered
        const existing = await prisma.registration.findFirst({
          where: {
            userId: user.id,
            tournamentId: tournament.id,
            categoryId: category.id
          }
        });

        if (existing) {
          console.log(`⏭️  ${user.name} - Already registered`);
          alreadyRegistered++;
          continue;
        }

        // Create registration
        const registration = await prisma.registration.create({
          data: {
            userId: user.id,
            tournamentId: tournament.id,
            categoryId: category.id,
            status: 'confirmed',
            paymentStatus: 'completed',
            amountWallet: 1000,
            amountTotal: 1000
          }
        });

        console.log(`✅ ${user.name} - Registered successfully`);
        registered++;

      } catch (error) {
        console.log(`❌ ${user.name} - Failed: ${error.message}`);
        failed++;
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('📊 Registration Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Successfully registered: ${registered}`);
    console.log(`⏭️  Already registered: ${alreadyRegistered}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total users processed: ${users.length}`);
    console.log('═══════════════════════════════════════\n');

    // Update category registration count
    const totalRegistrations = await prisma.registration.count({
      where: {
        tournamentId: tournament.id,
        categoryId: category.id,
        status: 'confirmed'
      }
    });

    await prisma.category.update({
      where: { id: category.id },
      data: { registrationCount: totalRegistrations }
    });

    console.log(`✅ Category updated with ${totalRegistrations} total registrations\n`);

    // Show final stats
    const finalStats = await prisma.registration.findMany({
      where: {
        tournamentId: tournament.id,
        categoryId: category.id,
        status: 'confirmed'
      },
      include: {
        user: {
          select: {
            name: true,
            city: true
          }
        }
      }
    });

    console.log(`🎉 Tournament now has ${finalStats.length} confirmed registrations!\n`);

    // Show sample registrations
    console.log('📋 Sample registrations (first 10):');
    finalStats.slice(0, 10).forEach((reg, index) => {
      console.log(`   ${index + 1}. ${reg.user.name} (${reg.user.city})`);
    });

    console.log('\n✅ All done! Tournament is ready for draw generation.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

register128Users();
