import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMatchScore() {
  const matchId = 'd15ef7d8-9e35-4cc2-aa1c-87122ac6815f';
  
  // Reset the match to SCHEDULED status with proper score structure
  const initialScore = {
    sets: [{ player1: 0, player2: 0 }],
    currentSet: 0,
    matchConfig: {
      pointsPerSet: 21,
      setsToWin: 2,
      maxSets: 3,
      extension: true
    }
  };

  await prisma.match.update({
    where: { id: matchId },
    data: {
      status: 'SCHEDULED',
      startedAt: null,
      scoreJson: JSON.stringify(initialScore)
    }
  });

  console.log('✅ Match reset successfully!');
  console.log('You can now start the match again from the app.');
  
  await prisma.$disconnect();
}

fixMatchScore().catch(console.error);
