import prisma from './src/lib/prisma.js';

async function fixMensStatus() {
  try {
    console.log('🔧 Fixing P S LOCHAN mens registration status...\n');

    // Find the mens registration
    const user = await prisma.user.findUnique({
      where: { email: 'pslochan2006@gmail.com' },
      select: { id: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    const mensReg = await prisma.registration.findFirst({
      where: {
        userId: user.id,
        category: {
          name: {
            contains: 'mens',
            mode: 'insensitive'
          }
        }
      },
      include: {
        category: true
      }
    });

    if (!mensReg) {
      console.log('❌ Mens registration not found');
      return;
    }

    console.log('📋 Current status:', mensReg.status);
    console.log('📋 Category:', mensReg.category.name);
    console.log('');

    // Update to rejected
    const updated = await prisma.registration.update({
      where: { id: mensReg.id },
      data: {
        status: 'rejected',
        paymentStatus: 'rejected'
      }
    });

    console.log('✅ Status updated!');
    console.log('   Old status:', mensReg.status);
    console.log('   New status:', updated.status);
    console.log('');
    console.log('✅ User can now register again for mens category!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMensStatus();
