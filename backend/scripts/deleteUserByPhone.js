import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deleteUser() {
  try {
    const phone = '+918008418180';
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { phone }
    });
    
    if (!user) {
      console.log('No user found with phone:', phone);
      return;
    }

    console.log('Found user:', user.email, user.name);
    console.log('Deleting user and related data...');

    // Delete related profiles
    await prisma.playerProfile.deleteMany({ where: { userId: user.id } });
    await prisma.organizerProfile.deleteMany({ where: { userId: user.id } });
    await prisma.umpireProfile.deleteMany({ where: { userId: user.id } });
    
    // Delete notifications
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    
    // Delete registrations
    await prisma.registration.deleteMany({ where: { userId: user.id } });
    
    // Delete wallet transactions
    await prisma.walletTransaction.deleteMany({ where: { userId: user.id } });

    // Finally delete user
    await prisma.user.delete({ where: { id: user.id } });
    
    console.log('✅ User deleted successfully!');
    console.log('You can now register with phone:', phone);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();