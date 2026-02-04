import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function advanceWinner() {
  // Get Match #3
  const match3 = await prisma.match.findFirst({
    where: {
      matchNumber: 3,
      tournamentId: '4a54977d-bfbc-42e0-96c3-b020000d81f6'
    }
  });

  console.log('Match #3:', {
    id: match3.id,
    winnerId: match3.winnerId,
    parentMatchId: match3.parentMatchId,
    winnerPosition: match3.winnerPosition
  });

  if (match3.winnerId && match3.parentMatchId && match3.winnerPosition) {
    // Update parent match
    const updateData = {};
    if (match3.winnerPosition === 'player1') {
      updateData.player1Id = match3.winnerId;
    } else {
      updateData.player2Id = match3.winnerId;
    }

    await prisma.match.update({
      where: { id: match3.parentMatchId },
      data: updateData
    });

    console.log(`✅ Advanced winner to ${match3.winnerPosition} of parent match`);
  }

  await prisma.$disconnect();
}

advanceWinner();
