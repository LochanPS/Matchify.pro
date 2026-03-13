import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMatchesAPI() {
  console.log('🧪 Testing Matches API Response...\n');

  try {
    // Delete duplicate Match #1 in Round 2
    const duplicates = await prisma.match.findMany({
      where: {
        tournamentId: '4a54977d-bfbc-42e0-96c3-b020000d81f6',
        categoryId: '68a7a3eb-1ba0-446e-9a0f-cf8597b8b748',
        matchNumber: 1,
        round: 2
      }
    });

    if (duplicates.length > 0) {
      console.log('Found duplicate Match #1 in Round 2, deleting...');
      for (const dup of duplicates) {
        await prisma.match.delete({ where: { id: dup.id } });
      }
      console.log('✅ Deleted duplicate\n');
    }

    // Fetch matches like the API does
    const matches = await prisma.match.findMany({
      where: {
        tournamentId: '4a54977d-bfbc-42e0-96c3-b020000d81f6',
        categoryId: '68a7a3eb-1ba0-446e-9a0f-cf8597b8b748'
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });

    console.log('📊 Matches from database:\n');

    for (const match of matches) {
      console.log(`Match #${match.matchNumber} (Round ${match.round}):`);
      console.log(`  Status: ${match.status}`);
      
      // Fetch player details like the API should
      let player1 = null;
      let player2 = null;
      
      if (match.player1Id) {
        player1 = await prisma.user.findUnique({
          where: { id: match.player1Id },
          select: { id: true, name: true, email: true, profilePhoto: true }
        });
      }
      
      if (match.player2Id) {
        player2 = await prisma.user.findUnique({
          where: { id: match.player2Id },
          select: { id: true, name: true, email: true, profilePhoto: true }
        });
      }

      console.log(`  Player 1: ${player1 ? player1.name : 'TBD'}`);
      console.log(`  Player 2: ${player2 ? player2.name : 'TBD'}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMatchesAPI();
