import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findFirst({
    where: { email: 'prime@gmail.com' },
    select: { name: true, walletBalance: true, id: true }
  });
  console.log('User:', user);
  
  const transactions = await prisma.walletTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('Recent transactions:', transactions);
  
  await prisma.$disconnect();
}
check();
