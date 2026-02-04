import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkRegistrations() {
  try {
    console.log('🔍 Checking registrations...\n');

    // Find the ace badminton tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: {
          contains: 'ace',
          mode: 'insensitive'
        }
      }
    });

    if (!tournament) {
      console.log('❌ Tournament not found!');
      return;
    }

    console.log(`✅ Tournament: ${tournament.name}`);
    console.log(`   ID: ${tournament.id}\n`);

    // Get all registrations for this tournament
    const registrations = await prisma.registration.findMany({
      where: {
        tournamentId: tournament.id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`Found ${registrations.length} registrations:\n`);

    registrations.forEach((reg, index) => {
      console.log(`${index + 1}. ${reg.user.name}`);
      console.log(`   Email: ${reg.user.email}`);
      console.log(`   Category: ${reg.category.name}`);
      console.log(`   Payment Status: ${reg.paymentStatus}`);
      console.log(`   Status: ${reg.status}`);
      console.log(`   Amount: ₹${reg.amountTotal}`);
      console.log(`   Screenshot: ${reg.paymentScreenshot || 'None'}`);
      console.log(`   Created: ${reg.createdAt}\n`);
    });

    // Check what the payment verification endpoint would return
    console.log('\n📊 Payment Status Summary:');
    const pending = registrations.filter(r => r.paymentStatus === 'submitted');
    const verified = registrations.filter(r => r.paymentStatus === 'verified');
    const rejected = registrations.filter(r => r.paymentStatus === 'rejected');
    
    console.log(`   Submitted (Pending): ${pending.length}`);
    console.log(`   Verified: ${verified.length}`);
    console.log(`   Rejected: ${rejected.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRegistrations();
