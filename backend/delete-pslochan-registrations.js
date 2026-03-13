import prisma from './src/lib/prisma.js';

async function deleteRegistrations() {
  try {
    console.log('🗑️  Deleting P S LOCHAN registrations...\n');

    const registrationIds = [
      '4a271270-4268-4452-bfcf-2fccbfa2844c', // mens
      'c37f5210-91a4-4fc3-b5b6-732a3ef80b5e'  // d 18
    ];

    for (const id of registrationIds) {
      const reg = await prisma.registration.findUnique({
        where: { id },
        include: { category: true }
      });

      if (reg) {
        console.log(`🗑️  Deleting ${reg.category.name} registration...`);
        
        // Delete payment verification if exists
        try {
          await prisma.paymentVerification.deleteMany({
            where: { registrationId: id }
          });
          console.log('   ✅ Payment verification deleted');
        } catch (e) {
          console.log('   ℹ️  No payment verification found');
        }

        // Delete registration
        await prisma.registration.delete({
          where: { id }
        });
        console.log('   ✅ Registration deleted');
        console.log('');
      }
    }

    console.log('✅ All registrations deleted!');
    console.log('✅ User can now register fresh!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteRegistrations();
