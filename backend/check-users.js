import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'Pradyumna' } },
        { name: { contains: 'lochan' } },
        { email: { contains: 'P@gmail.com' } }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      totalPoints: true,
      matchesWon: true,
      matchesLost: true
    }
  });

  console.log('Users found:');
  users.forEach(u => {
    console.log(`- ${u.name} (${u.email}): ${u.totalPoints} points, ${u.matchesWon}W-${u.matchesLost}L`);
  });

  // Check matches
  const matches = await prisma.match.findMany({
    where: {
      status: 'COMPLETED',
      winnerId: { not: null }
    },
    select: {
      id: true,
      winnerId: true,
      player1Id: true,
      player2Id: true,
      stage: true,
      winner: {
        select: { name: true, email: true }
      }
    }
  });

  console.log('\nCompleted matches:');
  matches.forEach(m => {
    console.log(`- Winner: ${m.winner?.name} (${m.winner?.email}), Stage: ${m.stage || 'KNOCKOUT (default)'}`);
  });

  await prisma.$disconnect();
}

checkUsers();
