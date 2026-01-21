import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function removeTestUser() {
  try {
    console.log('🔍 Looking for test user...');
    
    // Find the test user
    const testUser = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: 'Test User Fix', mode: 'insensitive' } },
          { email: { contains: 'testfix', mode: 'insensitive' } },
          { email: { contains: 'example.com', mode: 'insensitive' } }
        ]
      }
    });

    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('✅ Found test user:', {
      id: testUser.id,
      name: testUser.name,
      email: testUser.email,
      role: testUser.role
    });

    // Delete related data first (due to foreign key constraints)
    console.log('🗑️ Deleting related data...');
    
    // Delete registrations
    await prisma.registration.deleteMany({
      where: { userId: testUser.id }
    });
    
    // Delete tournaments
    await prisma.tournament.deleteMany({
      where: { organizerId: testUser.id }
    });
    
    // Delete notifications
    await prisma.notification.deleteMany({
      where: { userId: testUser.id }
    });
    
    // Delete payment verifications
    await prisma.paymentVerification.deleteMany({
      where: { userId: testUser.id }
    });
    
    // Delete user payment ledger entries
    await prisma.userPaymentLedger.deleteMany({
      where: { userId: testUser.id }
    });
    
    // Delete user payment summary
    await prisma.userPaymentSummary.deleteMany({
      where: { userId: testUser.id }
    });

    // Finally delete the user
    console.log('🗑️ Deleting test user...');
    await prisma.user.delete({
      where: { id: testUser.id }
    });

    console.log('✅ Test user removed successfully!');
    
    // Verify removal
    const remainingUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        roles: true
      }
    });
    
    console.log('📊 Remaining users:');
    remainingUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.roles}`);
    });

  } catch (error) {
    console.error('❌ Error removing test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeTestUser();