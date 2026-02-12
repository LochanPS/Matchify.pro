import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteMatch7() {
  await prisma.match.delete({
    where: { id: '8d58bb1f-e564-4e93-8a2e-70853c2c397a' }
  });

  console.log('✅ Deleted Match #7');

  await prisma.$disconnect();
}

deleteMatch7();
