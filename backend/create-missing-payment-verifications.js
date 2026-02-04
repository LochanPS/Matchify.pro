import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createMissingPaymentVerifications() {
  try {
    console.log('🔄 Creating missing payment verification records...\n');

    // Find all registrations with payment screenshots but no verification record
    const registrations = await prisma.registration.findMany({
      where: {
        paymentScreenshot: {
          not: null
        },
        paymentVerification: null
      },
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
      }
    });

    console.log(`Found ${registrations.length} registrations needing verification records\n`);

    if (registrations.length === 0) {
      console.log('✅ All registrations with screenshots already have verification records!');
      return;
    }

    let createdCount = 0;

    for (const registration of registrations) {
      // Create payment verification record
      const verification = await prisma.paymentVerification.create({
        data: {
          registrationId: registration.id,
          tournamentId: registration.tournamentId,
          userId: registration.userId,
          amount: registration.amountTotal,
          paymentScreenshot: registration.paymentScreenshot,
          screenshotPublicId: null,
          status: registration.paymentStatus === 'verified' ? 'approved' : 'pending',
          submittedAt: registration.createdAt,
          verifiedAt: registration.paymentStatus === 'verified' ? registration.updatedAt : null
        }
      });

      console.log(`✅ Created verification for ${registration.user.name}`);
      console.log(`   Tournament: ${registration.tournament.name}`);
      console.log(`   Category: ${registration.category.name}`);
      console.log(`   Amount: ₹${registration.amountTotal}`);
      console.log(`   Status: ${verification.status}\n`);
      createdCount++;
    }

    console.log(`\n🎉 Created ${createdCount} payment verification records!`);
    console.log(`\nThese should now appear in the Admin Payment Verification page.`);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingPaymentVerifications();
