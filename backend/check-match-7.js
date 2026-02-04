import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMatch7() {
  const match = await prisma.match.findFirst({
    where: {
      matchNumber: 7,
      tournamentId: '4a54977d-bfbc-42e0-96c3-b020000d81f6'
    }
  });

  console.log('Match #7:', JSON.stringify(match, null, 2));

  await prisma.$disconnect();
}

checkMatch7();
