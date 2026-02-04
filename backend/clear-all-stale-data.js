import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllStaleData() {
  try {
    console.log('🧹 CLEARING ALL STALE DATA FROM DATABASE...\n');

    // 1. Clear all match data
    console.log('1️⃣ Clearing all matches...');
    const deletedMatches = await prisma.match.deleteMany({});
    console.log(`   ✅ Deleted ${deletedMatches.count} matches\n`);

    // 2. Clear all draw bracket data
    console.log('2️⃣ Resetting all draw brackets...');
    const draws = await prisma.draw.findMany({});
    
    for (const draw of draws) {
      let bracketJson = typeof draw.bracketJson === 'string' 
        ? JSON.parse(draw.bracketJson) 
        : draw.bracketJson;

      // Clear knockout brackets
      if (bracketJson.format === 'KNOCKOUT' && bracketJson.rounds) {
        bracketJson.rounds.forEach((round, roundIdx) => {
          round.matches.forEach((match, matchIdx) => {
            if (roundIdx === 0) {
              // First round: Keep slot placeholders
              match.player1 = { id: null, name: `Slot ${matchIdx * 2 + 1}`, seed: matchIdx * 2 + 1 };
              match.player2 = { id: null, name: `Slot ${matchIdx * 2 + 2}`, seed: matchIdx * 2 + 2 };
            } else {
              // Other rounds: Set to TBD
              match.player1 = { id: null, name: 'TBD', seed: null };
              match.player2 = { id: null, name: 'TBD', seed: null };
            }
            match.winner = null;
            match.winnerId = null;
            match.score1 = null;
            match.score2 = null;
            match.status = 'PENDING';
          });
        });
      }

      // Clear round robin brackets
      if ((bracketJson.format === 'ROUND_ROBIN' || bracketJson.format === 'ROUND_ROBIN_KNOCKOUT') && bracketJson.groups) {
        let slotNum = 1;
        bracketJson.groups.forEach(group => {
          group.participants.forEach((participant, idx) => {
            group.participants[idx] = {
              id: null,
              name: `Slot ${slotNum}`,
              seed: slotNum,
              played: 0,
              wins: 0,
              losses: 0,
              points: 0
            };
            slotNum++;
          });
          group.matches = [];
          group.totalMatches = 0;
        });
      }

      // Clear knockout in round robin + knockout
      if (bracketJson.format === 'ROUND_ROBIN_KNOCKOUT' && bracketJson.knockout) {
        if (bracketJson.knockout.rounds) {
          bracketJson.knockout.rounds.forEach((round, roundIdx) => {
            round.matches.forEach((match, matchIdx) => {
              if (roundIdx === 0) {
                match.player1 = { id: null, name: `Slot ${matchIdx * 2 + 1}`, seed: matchIdx * 2 + 1 };
                match.player2 = { id: null, name: `Slot ${matchIdx * 2 + 2}`, seed: matchIdx * 2 + 2 };
              } else {
                match.player1 = { id: null, name: 'TBD', seed: null };
                match.player2 = { id: null, name: 'TBD', seed: null };
              }
              match.winner = null;
              match.winnerId = null;
              match.score1 = null;
              match.score2 = null;
              match.status = 'PENDING';
            });
          });
        }
      }

      await prisma.draw.update({
        where: { id: draw.id },
        data: { bracketJson: JSON.stringify(bracketJson) }
      });
    }
    
    console.log(`   ✅ Reset ${draws.length} draw brackets\n`);

    console.log('✅ ALL STALE DATA CLEARED!\n');
    console.log('📋 Summary:');
    console.log(`   - Deleted ${deletedMatches.count} matches from database`);
    console.log(`   - Reset ${draws.length} draw brackets to empty state`);
    console.log(`   - All player assignments cleared`);
    console.log(`   - All match results cleared\n`);
    console.log('🎯 Database is now clean. Matches will only be created when you assign players.\n');

  } catch (error) {
    console.error('❌ Error clearing stale data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllStaleData();
