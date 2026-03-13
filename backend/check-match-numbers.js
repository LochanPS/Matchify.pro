import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMatchNumbers() {
  console.log('🔍 Checking Match Numbers...\n');

  try {
    // Get the draw
    const draw = await prisma.draw.findUnique({
      where: {
        tournamentId_categoryId: {
          tournamentId: '4a54977d-bfbc-42e0-96c3-b020000d81f6',
          categoryId: '68a7a3eb-1ba0-446e-9a0f-cf8597b8b748'
        }
      }
    });

    const bracket = JSON.parse(draw.bracketJson);
    
    console.log('📋 BRACKET JSON Match Numbers:\n');
    bracket.rounds.forEach((round, idx) => {
      console.log(`Round ${idx} (${bracket.rounds.length - idx} in DB):`);
      round.matches.forEach((match, matchIdx) => {
        console.log(`  Match Index ${matchIdx}: matchNumber = ${match.matchNumber}`);
      });
      console.log('');
    });

    // Get database matches
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

    console.log('\n📊 DATABASE Match Numbers:\n');
    const byRound = {};
    matches.forEach(m => {
      if (!byRound[m.round]) byRound[m.round] = [];
      byRound[m.round].push(m);
    });

    Object.keys(byRound).sort((a, b) => b - a).forEach(round => {
      console.log(`Round ${round}:`);
      byRound[round].forEach(m => {
        console.log(`  Match #${m.matchNumber}`);
      });
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMatchNumbers();
