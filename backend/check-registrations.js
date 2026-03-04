import prisma from './src/lib/prisma.js';

async function checkRegistrations() {
  try {
    console.log('🔍 Checking all registrations...\n');
    
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
            name: true,
            organizerId: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`Total registrations: ${registrations.length}\n`);
    
    if (registrations.length > 0) {
      registrations.forEach((reg, index) => {
        console.log(`${index + 1}. Registration ID: ${reg.id}`);
        console.log(`   Player: ${reg.user.name} (${reg.user.email})`);
        console.log(`   Tournament: ${reg.tournament.name}`);
        console.log(`   Category: ${reg.category.name}`);
        console.log(`   Status: ${reg.status}`);
        console.log(`   Payment Status: ${reg.paymentStatus}`);
        console.log(`   Tournament ID: ${reg.tournamentId}`);
        console.log(`   Organizer ID: ${reg.tournament.organizerId}`);
        console.log('');
      });
    } else {
      console.log('❌ No registrations found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRegistrations();
