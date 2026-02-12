import prisma from './src/lib/prisma.js';

async function checkTournaments() {
  try {
    console.log('🏆 Checking tournaments in database...\n');

    const tournaments = await prisma.tournament.findMany({
      include: {
        organizer: {
          select: {
            name: true,
            email: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true,
            gender: true,
            ageGroup: true,
            status: true
          }
        },
        _count: {
          select: {
            registrations: true,
            categories: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (tournaments.length === 0) {
      console.log('❌ No tournaments found in database\n');
      console.log('💡 You need to create a tournament first!');
      console.log('   1. Login as admin or organizer');
      console.log('   2. Go to "Create Tournament" page');
      console.log('   3. Fill in tournament details');
      console.log('   4. Add categories');
      console.log('   5. Publish tournament\n');
    } else {
      console.log(`✅ Found ${tournaments.length} tournament(s):\n`);
      
      tournaments.forEach((tournament, index) => {
        console.log(`${index + 1}. ${tournament.name}`);
        console.log(`   ID: ${tournament.id}`);
        console.log(`   Status: ${tournament.status}`);
        console.log(`   Organizer: ${tournament.organizer.name} (${tournament.organizer.email})`);
        console.log(`   Location: ${tournament.city}, ${tournament.state}`);
        console.log(`   Start Date: ${tournament.startDate}`);
        console.log(`   End Date: ${tournament.endDate}`);
        console.log(`   Entry Fee: ₹${tournament.entryFee}`);
        console.log(`   Categories: ${tournament._count.categories}`);
        console.log(`   Registrations: ${tournament._count.registrations}`);
        
        if (tournament.categories.length > 0) {
          console.log(`   Category Details:`);
          tournament.categories.forEach(cat => {
            console.log(`     - ${cat.name} (${cat.gender}, ${cat.ageGroup}) - ${cat.status}`);
          });
        }
        console.log('');
      });
    }

    // Check registration status
    const registrations = await prisma.registration.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        tournament: {
          select: {
            name: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    if (registrations.length > 0) {
      console.log(`\n📝 Recent Registrations (last 10):\n`);
      registrations.forEach((reg, index) => {
        console.log(`${index + 1}. ${reg.user.name} → ${reg.tournament.name} (${reg.category.name})`);
        console.log(`   Status: ${reg.status}`);
        console.log(`   Amount: ₹${reg.amountTotal}`);
        console.log('');
      });
    }

    console.log('✅ Check complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTournaments();
