import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Update ALL users to ₹20
  const result = await prisma.user.updateMany({
    data: { walletBalance: 20 }
  });

  console.log(`Updated ${result.count} accounts to ₹20`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
