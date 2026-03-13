import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBracket() {
  const tournamentId = '4a54977d-bfbc-42e0-96c3-b020000d81f6';
  
  const matches = await prisma.match.findMany({
    where: { tournamentId },
    orderBy: [{ round: 'desc' }, { matchNumber: 'asc' }],
    select: {
      id: true,
      matchNumber: true,
      round: true,
      parentMatchId: true,
      winnerPosition: true,
      player1Id: true,
      player2Id: true,
      status: true,
      winnerId: true
    }
  });

  console.log('\n=== BRACKET STRUCTURE ===\n');
  
  matches.forEach(match => {
    const roundName = match.round === 1 ? 'FINAL' : match.round === 2 ? 'SEMI' : 'QUARTER';
    console.log(`${roundName} Match #${match.matchNumber}:`);
    console.log(`  ID: ${match.id.substring(0, 8)}...`);
    console.log(`  Status: ${match.status}`);
    console.log(`  Winner: ${match.winnerId ? match.winnerId.substring(0, 8) + '...' : 'None'}`);
    console.log(`  Parent: ${match.parentMatchId ? match.parentMatchId.substring(0, 8) + '...' : 'None'}`);
    console.log(`  Position: ${match.winnerPosition || 'None'}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkBracket().catch(console.error);
