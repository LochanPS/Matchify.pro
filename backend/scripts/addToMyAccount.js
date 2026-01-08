import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addCredits() {
  const user = await prisma.user.findFirst({ where: { email: 'prime@gmail.com' } });
  const newBalance = user.walletBalance + 10000;

  await prisma.user.update({
    where: { id: user.id },
    data: { walletBalance: newBalance }
  });

  await prisma.walletTransaction.create({
    data: {
      userId: user.id,
      type: 'CREDIT',
      amount: 10000,
      balanceBefore: user.walletBalance,
      balanceAfter: newBalance,
      description: 'Admin credit - Development testing',
      status: 'COMPLETED'
    }
  });

  console.log(`✅ ${user.name}: ₹${user.walletBalance} → ₹${newBalance}`);
  await prisma.$disconnect();
}

addCredits();
