import prisma from './src/lib/prisma.js';

async function checkPaymentVerification() {
  try {
    console.log('🔍 Checking Payment Verification for P S LOCHAN...\n');

    const registrationId = '3e79896f-96c1-49c9-b7a1-93ca19f31fd6';

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        category: true,
        user: true,
        tournament: true
      }
    });

    console.log('📋 Registration:');
    console.log(`   User: ${registration.user.name}`);
    console.log(`   Category: ${registration.category.name}`);
    console.log(`   Tournament: ${registration.tournament.name}`);
    console.log(`   Status: ${registration.status}`);
    console.log(`   Payment Status: ${registration.paymentStatus}`);
    console.log(`   Payment Screenshot: ${registration.paymentScreenshot ? 'YES' : 'NO'}`);
    console.log('');

    const paymentVerification = await prisma.paymentVerification.findUnique({
      where: { registrationId }
    });

    if (paymentVerification) {
      console.log('✅ PaymentVerification EXISTS:');
      console.log(`   ID: ${paymentVerification.id}`);
      console.log(`   Status: ${paymentVerification.status}`);
      console.log(`   Amount: ₹${paymentVerification.amount}`);
      console.log(`   Screenshot: ${paymentVerification.paymentScreenshot ? 'YES' : 'NO'}`);
      console.log(`   Created: ${paymentVerification.createdAt}`);
    } else {
      console.log('❌ PaymentVerification DOES NOT EXIST!');
      console.log('   This is why admin cannot see it!');
    }

    console.log('');
    console.log('📊 All pending payment verifications:');
    const allPending = await prisma.paymentVerification.findMany({
      where: { status: 'pending' },
      include: {
        registration: {
          include: {
            user: { select: { name: true } },
            category: { select: { name: true } },
            tournament: { select: { name: true } }
          }
        }
      }
    });

    console.log(`   Found ${allPending.length} pending verifications:`);
    allPending.forEach((pv, index) => {
      console.log(`   ${index + 1}. ${pv.registration.user.name} - ${pv.registration.category.name} - ${pv.registration.tournament.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPaymentVerification();
