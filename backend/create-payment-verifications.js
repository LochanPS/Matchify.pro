import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createPaymentVerifications() {
  try {
    console.log('🔄 Creating payment verification records...\n');

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

    console.log(`✅ Found tournament: ${tournament.name}\n`);

    // Get all registrations for this tournament
    const registrations = await prisma.registration.findMany({
      where: {
        tournamentId: tournament.id,
        paymentStatus: 'submitted'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`Found ${registrations.length} registrations needing verification\n`);

    let createdCount = 0;

    for (const registration of registrations) {
      // Check if payment verification already exists
      const existingVerification = await prisma.paymentVerification.findUnique({
        where: {
          registrationId: registration.id
        }
      });

      if (existingVerification) {
        console.log(`⚠️  Verification already exists for ${registration.user.name}`);
        continue;
      }

      // Create payment verification record
      const verification = await prisma.paymentVerification.create({
        data: {
          registrationId: registration.id,
          tournamentId: registration.tournamentId,
          userId: registration.userId,
          amount: registration.amountTotal,
          paymentScreenshot: registration.paymentScreenshot || 'https://via.placeholder.com/400x600?text=Admin+Approved+Payment',
          screenshotPublicId: null,
          status: 'pending',
          submittedAt: registration.createdAt
        }
      });

      console.log(`✅ Created verification for ${registration.user.name} - ₹${registration.amountTotal}`);
      createdCount++;
    }

    console.log(`\n🎉 Created ${createdCount} payment verification records!`);
    console.log(`\nThese should now appear in the Payment Verification page.`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPaymentVerifications();
