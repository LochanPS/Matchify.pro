import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkKnockoutStatus() {
  try {
    console.log('🔍 Checking knockout matches status...\n');

    const draw = await prisma.draw.findFirst({
      where: { format: 'ROUND_ROBIN_KNOCKOUT' }
    });

    if (!draw) {
      console.log('❌ No draw found');
      return;
    }

    const knockoutMatches = await prisma.match.findMany({
      where: {
        tournamentId: draw.tournamentId,
        categoryId: draw.categoryId,
        stage: 'KNOCKOUT'
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });

    console.log(`Found ${knockoutMatches.length} knockout matches:\n`);

    for (const match of knockoutMatches) {
      const player1 = match.player1Id ? await prisma.user.findUnique({ 
        where: { id: match.player1Id }, 
        select: { name: true } 
      }) : null;
      
      const player2 = match.player2Id ? await prisma.user.findUnique({ 
        where: { id: match.player2Id }, 
        select: { name: true } 
      }) : null;

      console.log(`Match ${match.matchNumber} (Round ${match.round}):`);
      console.log(`  ID: ${match.id}`);
      console.log(`  Player 1 ID: ${match.player1Id || 'NULL'}`);
      console.log(`  Player 1 Name: ${player1?.name || 'NULL'}`);
      console.log(`  Player 2 ID: ${match.player2Id || 'NULL'}`);
      console.log(`  Player 2 Name: ${player2?.name || 'NULL'}`);
      console.log(`  Status: ${match.status}`);
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkKnockoutStatus();
