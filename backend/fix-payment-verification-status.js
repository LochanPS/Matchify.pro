import prisma from './src/lib/prisma.js';

async function fixPaymentVerificationStatus() {
  try {
    console.log('🔧 Fixing PaymentVerification status...\n');

    const registrationId = '3e79896f-96c1-49c9-b7a1-93ca19f31fd6';

    // Get current state
    const before = await prisma.paymentVerification.findUnique({
      where: { registrationId }
    });

    console.log('📋 BEFORE:');
    console.log(`   Status: ${before.status}`);
    console.log(`   Amount: ₹${before.amount}`);
    console.log('');

    // Update to pending
    const after = await prisma.paymentVerification.update({
      where: { registrationId },
      data: {
        status: 'pending',
        rejectionReason: null,
        verifiedBy: null,
        verifiedAt: null,
      }
    });

    console.log('✅ AFTER:');
    console.log(`   Status: ${after.status}`);
    console.log(`   Amount: ₹${after.amount}`);
    console.log('');
    console.log('✅ PaymentVerification status fixed! Admin can now see it.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPaymentVerificationStatus();
