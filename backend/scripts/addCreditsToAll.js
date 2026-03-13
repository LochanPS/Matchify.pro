import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addCreditsToAllUsers() {
  console.log('🎯 Adding ₹10 Matchify credits to ALL users...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        walletBalance: true
      }
    });

    console.log(`Found ${users.length} user(s)\n`);

    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    // Update each user's wallet balance
    for (const user of users) {
      const newBalance = user.walletBalance + 10;
      
      await prisma.user.update({
        where: { id: user.id },
        data: { walletBalance: newBalance }
      });

      // Create a wallet transaction record
      await prisma.walletTransaction.create({
        data: {
          userId: user.id,
          type: 'CREDIT',
          amount: 10,
          balanceBefore: user.walletBalance,
          balanceAfter: newBalance,
          description: 'Matchify promotional credits - Thank you for using Matchify.pro!',
          status: 'COMPLETED'
        }
      });

      console.log(`✅ ${user.name} (${user.email})`);
      console.log(`   ₹${user.walletBalance} → ₹${newBalance}`);
    }

    console.log(`\n🎉 Successfully added ₹10 to ${users.length} account(s)!`);

  } catch (error) {
    console.error('Error adding credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCreditsToAllUsers();
