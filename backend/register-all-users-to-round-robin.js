import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function registerAllUsersToRoundRobin() {
  try {
    console.log('🎾 Registering ALL users to Round Robin tournament\n');
    console.log('='.repeat(60));

    // Find the "ace badminton" tournament with "round robin" category
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: {
          contains: 'ace',
          mode: 'insensitive'
        }
      },
      include: {
        categories: {
          where: {
            name: {
              contains: 'round robin',
              mode: 'insensitive'
            }
          }
        }
      }
    });

    if (!tournament) {
      console.log('❌ Ace Badminton tournament not found!');
      return;
    }

    if (tournament.categories.length === 0) {
      console.log('❌ Round Robin category not found in this tournament!');
      return;
    }

    // Show all categories
    console.log('\n📋 Available categories:');
    tournament.categories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.format}, ${cat.gender}, ₹${cat.entryFee})`);
    });

    // Get ALL users from database
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        city: true,
        state: true
      }
    });

    console.log(`\n✅ Found ${allUsers.length} total users in database\n`);
    console.log('='.repeat(60));

    let totalRegistrations = 0;

    // Register each user to ALL suitable categories
    for (const user of allUsers) {
      console.log(`\n👤 Processing: ${user.name} (${user.email})`);
      
      for (const category of tournament.categories) {
        // Check if user is suitable for this category
        const genderMatch = 
          category.gender === 'mixed' || 
          category.gender === user.gender?.toLowerCase() ||
          category.gender === 'OPEN';

        if (!genderMatch) {
          console.log(`   ⏭️  Skipping ${category.name} - gender mismatch`);
          continue;
        }

        // Check if already registered
        const existingRegistration = await prisma.registration.findFirst({
          where: {
            userId: user.id,
            tournamentId: tournament.id,
            categoryId: category.id
          }
        });

        if (existingRegistration) {
          console.log(`   ⏭️  Already registered to ${category.name}`);
          continue;
        }

        // Create registration (already confirmed for testing)
        const registration = await prisma.registration.create({
          data: {
            userId: user.id,
            tournamentId: tournament.id,
            categoryId: category.id,
            status: 'confirmed', // Auto-confirm for testing
            amountTotal: category.entryFee,
            paymentStatus: 'completed'
          }
        });

        console.log(`   ✅ Registered to ${category.name} (ID: ${registration.id})`);

        // Update category registration count
        await prisma.category.update({
          where: { id: category.id },
          data: {
            registrationCount: {
              increment: 1
            }
          }
        });

        totalRegistrations++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n🎉 Registration Complete!`);
    console.log(`   Total registrations created: ${totalRegistrations}`);
    console.log(`   Users registered: ${allUsers.length}`);
    console.log(`   Categories: ${tournament.categories.length}`);
    
    // Show final category counts
    console.log('\n📊 Final Registration Counts:');
    const updatedCategories = await prisma.category.findMany({
      where: { tournamentId: tournament.id },
      select: {
        name: true,
        registrationCount: true,
        maxParticipants: true
      }
    });
    
    updatedCategories.forEach(cat => {
      console.log(`   ${cat.name}: ${cat.registrationCount}/${cat.maxParticipants || '∞'} registered`);
    });

    console.log('\n✅ All users have been registered to the Round Robin tournament!');
    console.log('   You can now create draws and start matches.\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
registerAllUsersToRoundRobin();
