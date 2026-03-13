import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetKnockoutMatches() {
  try {
    console.log('🔄 Resetting all knockout matches to PENDING...');

    // Get all knockout matches
    const knockoutMatches = await prisma.match.findMany({
      where: {
        stage: 'KNOCKOUT'
      }
    });

    console.log(`Found ${knockoutMatches.length} knockout matches`);

    // Reset each match
    for (const match of knockoutMatches) {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: 'PENDING',
          winnerId: null,
          score: null,
          startTime: null,
          endTime: null,
          umpireId: null
        }
      });
      console.log(`✅ Reset match ${match.matchNumber} (${match.id})`);
    }

    console.log('✅ All knockout matches reset to PENDING!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetKnockoutMatches();
