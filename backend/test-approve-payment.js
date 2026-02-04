import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testApprovePayment() {
  try {
    console.log('🧪 Testing payment approval...\n');

    // Get first pending verification
    const verification = await prisma.paymentVerification.findFirst({
      where: {
        status: 'pending'
      },
      include: {
        registration: {
          include: {
            user: true,
            tournament: true,
            category: true
          }
        }
      }
    });

    if (!verification) {
      console.log('❌ No pending verifications found');
      return;
    }

    console.log(`Found pending verification:`);
    console.log(`  ID: ${verification.id}`);
    console.log(`  User: ${verification.registration.user.name}`);
    console.log(`  Tournament: ${verification.registration.tournament.name}`);
    console.log(`  Amount: ₹${verification.amount}`);
    console.log(`  Status: ${verification.status}\n`);

    // Simulate approval
    console.log('Simulating approval...\n');

    // Update verification
    await prisma.paymentVerification.update({
      where: { id: verification.id },
      data: {
        status: 'approved',
        verifiedBy: 'test-admin',
        verifiedAt: new Date()
      }
    });

    // Update registration
    await prisma.registration.update({
      where: { id: verification.registrationId },
      data: {
        paymentStatus: 'verified',
        status: 'confirmed'
      }
    });

    console.log('✅ Payment approved successfully!');
    console.log('\nVerification updated:');
    console.log(`  Status: approved`);
    console.log(`  Verified at: ${new Date().toISOString()}`);

    console.log('\nRegistration updated:');
    console.log(`  Payment Status: verified`);
    console.log(`  Status: confirmed`);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testApprovePayment();
