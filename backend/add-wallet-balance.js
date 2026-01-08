import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addWalletBalance() {
  try {
    const player = await prisma.user.findFirst({
      where: { email: 'testplayer@matchify.com' },
    });

    if (!player) {
      console.log('❌ Player not found');
      return;
    }

    const balanceBefore = player.walletBalance;
    const amountToAdd = 5000; // Add ₹5000
    const balanceAfter = balanceBefore + amountToAdd;

    await prisma.user.update({
      where: { id: player.id },
      data: { walletBalance: balanceAfter },
    });

    await prisma.walletTransaction.create({
      data: {
        userId: player.id,
        type: 'ADMIN_CREDIT',
        amount: amountToAdd,
        balanceBefore,
        balanceAfter,
        description: 'Test wallet top-up for registration testing',
        status: 'COMPLETED',
      },
    });

    console.log('✅ Wallet balance added successfully');
    console.log(`   Player: ${player.name}`);
    console.log(`   Previous balance: ₹${balanceBefore}`);
    console.log(`   Added: ₹${amountToAdd}`);
    console.log(`   New balance: ₹${balanceAfter}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addWalletBalance();
