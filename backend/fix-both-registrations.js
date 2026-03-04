import prisma from './src/lib/prisma.js';

async function fixBothRegistrations() {
  try {
    console.log('🔧 Fixing BOTH registrations for P S LOCHAN...\n');

    const registrationIds = [
      '4a271270-4268-4452-bfcf-2fccbfa2844c', // mens
      'c37f5210-91a4-4fc3-b5b6-732a3ef80b5e'  // d 18
    ];

    for (const id of registrationIds) {
      const reg = await prisma.registration.findUnique({
        where: { id },
        include: { category: true }
      });

      console.log(`📋 ${reg.category.name}:`);
      console.log(`   Current status: ${reg.status}`);
      
      const updated = await prisma.registration.update({
        where: { id },
        data: {
          status: 'rejected',
          paymentStatus: 'rejected'
        }
      });

      console.log(`   New status: ${updated.status}`);
      console.log('');
    }

    console.log('✅ Both registrations updated to rejected!');
    console.log('✅ User can now register again!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBothRegistrations();
