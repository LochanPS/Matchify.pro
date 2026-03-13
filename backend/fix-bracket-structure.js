import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBracket() {
  const tournamentId = '4a54977d-bfbc-42e0-96c3-b020000d81f6';
  const categoryId = '68a7a3eb-1ba0-446e-9a0f-cf8597b8b748';
  
  console.log('🔧 Fixing bracket structure...\n');

  // Get all matches
  const matches = await prisma.match.findMany({
    where: { tournamentId, categoryId },
    orderBy: { matchNumber: 'asc' }
  });

  console.log(`Found ${matches.length} matches\n`);

  // For 8 players: 4 QF + 2 SF + 1 F = 7 matches
  // Current structure is wrong, let's fix it:
  
  // Match #1-4 should be Quarter Finals (round 3)
  // Match #5-6 should be Semi Finals (round 2)
  // Match #7 or #999 should be Final (round 1)

  const updates = [];

  // Find the actual final match (should be match #999 or the one with no parent)
  const finalMatch = matches.find(m => m.matchNumber === 999) || matches.find(m => m.matchNumber === 7);
  
  // Find semi final matches
  const semiMatches = matches.filter(m => m.matchNumber === 5 || m.matchNumber === 6);
  
  // Find quarter final matches
  const quarterMatches = matches.filter(m => [1, 2, 3, 4].includes(m.matchNumber));

  console.log('Identified matches:');
  console.log(`- Quarter Finals: ${quarterMatches.length} matches`);
  console.log(`- Semi Finals: ${semiMatches.length} matches`);
  console.log(`- Final: ${finalMatch ? 1 : 0} match\n`);

  if (quarterMatches.length !== 4 || semiMatches.length !== 2 || !finalMatch) {
    console.error('❌ Invalid bracket structure! Cannot fix automatically.');
    await prisma.$disconnect();
    return;
  }

  // Update Quarter Finals (matches 1-4) -> round 3
  // QF1 & QF2 -> SF1
  // QF3 & QF4 -> SF2
  await prisma.match.update({
    where: { id: quarterMatches[0].id },
    data: {
      round: 3,
      parentMatchId: semiMatches[0].id,
      winnerPosition: 'player1'
    }
  });
  console.log('✅ Updated QF Match #1 -> SF Match #5 (player1)');

  await prisma.match.update({
    where: { id: quarterMatches[1].id },
    data: {
      round: 3,
      parentMatchId: semiMatches[0].id,
      winnerPosition: 'player2'
    }
  });
  console.log('✅ Updated QF Match #2 -> SF Match #5 (player2)');

  await prisma.match.update({
    where: { id: quarterMatches[2].id },
    data: {
      round: 3,
      parentMatchId: semiMatches[1].id,
      winnerPosition: 'player1'
    }
  });
  console.log('✅ Updated QF Match #3 -> SF Match #6 (player1)');

  await prisma.match.update({
    where: { id: quarterMatches[3].id },
    data: {
      round: 3,
      parentMatchId: semiMatches[1].id,
      winnerPosition: 'player2'
    }
  });
  console.log('✅ Updated QF Match #4 -> SF Match #6 (player2)');

  // Update Semi Finals (matches 5-6) -> round 2
  await prisma.match.update({
    where: { id: semiMatches[0].id },
    data: {
      round: 2,
      parentMatchId: finalMatch.id,
      winnerPosition: 'player1'
    }
  });
  console.log('✅ Updated SF Match #5 -> Final (player1)');

  await prisma.match.update({
    where: { id: semiMatches[1].id },
    data: {
      round: 2,
      parentMatchId: finalMatch.id,
      winnerPosition: 'player2'
    }
  });
  console.log('✅ Updated SF Match #6 -> Final (player2)');

  // Update Final -> round 1
  await prisma.match.update({
    where: { id: finalMatch.id },
    data: {
      round: 1,
      matchNumber: 999, // Standard final match number
      parentMatchId: null,
      winnerPosition: null
    }
  });
  console.log('✅ Updated Final Match #999 -> round 1');

  // Now check if Match #1 was already completed and advance winner
  const completedQF1 = await prisma.match.findUnique({
    where: { id: quarterMatches[0].id }
  });

  if (completedQF1.status === 'COMPLETED' && completedQF1.winnerId) {
    await prisma.match.update({
      where: { id: semiMatches[0].id },
      data: { player1Id: completedQF1.winnerId }
    });
    console.log(`\n✅ Advanced winner from QF Match #1 to SF Match #5`);
  }

  console.log('\n🎉 Bracket structure fixed successfully!');
  console.log('\nNew structure:');
  console.log('QF Match #1 → SF Match #5 (player1)');
  console.log('QF Match #2 → SF Match #5 (player2)');
  console.log('QF Match #3 → SF Match #6 (player1)');
  console.log('QF Match #4 → SF Match #6 (player2)');
  console.log('SF Match #5 → Final (player1)');
  console.log('SF Match #6 → Final (player2)');

  await prisma.$disconnect();
}

fixBracket().catch(console.error);
