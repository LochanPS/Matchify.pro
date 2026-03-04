import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixKnockoutReset() {
  try {
    console.log('🔧 Starting Knockout Reset Fix...\n');

    // Get all tournaments with ROUND_ROBIN_KNOCKOUT format
    const draws = await prisma.draw.findMany({
      where: {
        format: 'ROUND_ROBIN_KNOCKOUT'
      },
      include: {
        tournament: true,
        category: true
      }
    });

    console.log(`📊 Found ${draws.length} Round Robin + Knockout draws\n`);

    for (const draw of draws) {
      console.log(`\n🎯 Processing: ${draw.tournament.name} - ${draw.category.name}`);
      
      const bracketJson = typeof draw.bracketJson === 'string' 
        ? JSON.parse(draw.bracketJson) 
        : draw.bracketJson;

      // STEP 1: Reset knockout bracket JSON
      if (bracketJson.knockout && bracketJson.knockout.rounds) {
        console.log('   🧹 Resetting knockout bracket JSON...');
        
        for (let roundIdx = 0; roundIdx < bracketJson.knockout.rounds.length; roundIdx++) {
          const round = bracketJson.knockout.rounds[roundIdx];
          
          for (let matchIdx = 0; matchIdx < round.matches.length; matchIdx++) {
            const match = round.matches[matchIdx];
            
            // For first round (semi-finals), keep player assignments but clear results
            if (roundIdx === 0) {
              match.winner = null;
              match.winnerId = null;
              match.score1 = null;
              match.score2 = null;
              match.status = 'PENDING';
              console.log(`      ✓ Reset Match ${matchIdx + 1}: ${match.player1?.name || 'TBD'} vs ${match.player2?.name || 'TBD'}`);
            } else {
              // For subsequent rounds (finals), clear everything
              match.player1 = null;
              match.player2 = null;
              match.winner = null;
              match.winnerId = null;
              match.score1 = null;
              match.score2 = null;
              match.status = 'PENDING';
              console.log(`      ✓ Cleared Match ${matchIdx + 1} (will be TBA)`);
            }
          }
        }

        // Save updated bracket JSON
        await prisma.draw.update({
          where: { id: draw.id },
          data: { 
            bracketJson: JSON.stringify(bracketJson),
            updatedAt: new Date()
          }
        });
        
        console.log('   ✅ Bracket JSON updated');
      }

      // STEP 2: Reset knockout matches in database
      const knockoutMatches = await prisma.match.findMany({
        where: {
          tournamentId: draw.tournamentId,
          categoryId: draw.categoryId,
          stage: 'KNOCKOUT'
        },
        orderBy: [
          { round: 'desc' }, // Higher round number = earlier round (semi-finals)
          { matchNumber: 'asc' }
        ]
      });

      console.log(`   📊 Found ${knockoutMatches.length} knockout matches in database`);

      if (knockoutMatches.length > 0) {
        // Find the highest round number (first round = semi-finals)
        const maxRound = Math.max(...knockoutMatches.map(m => m.round));
        const firstRoundMatches = knockoutMatches.filter(m => m.round === maxRound);
        const otherRoundMatches = knockoutMatches.filter(m => m.round < maxRound);

        console.log(`   🎯 First round (Round ${maxRound}): ${firstRoundMatches.length} matches`);
        console.log(`   🎯 Other rounds: ${otherRoundMatches.length} matches`);

        // Reset first round matches (keep players, clear results)
        for (const match of firstRoundMatches) {
          await prisma.match.update({
            where: { id: match.id },
            data: {
              status: 'PENDING',
              winnerId: null,
              scoreJson: null,
              startedAt: null,
              completedAt: null,
              umpireId: null
            }
          });
          console.log(`      ✓ Reset Match ${match.matchNumber} (kept player assignments)`);
        }

        // Clear all other round matches completely
        for (const match of otherRoundMatches) {
          await prisma.match.update({
            where: { id: match.id },
            data: {
              player1Id: null,
              player2Id: null,
              status: 'PENDING',
              winnerId: null,
              scoreJson: null,
              startedAt: null,
              completedAt: null,
              umpireId: null
            }
          });
          console.log(`      ✓ Cleared Match ${match.matchNumber} (Round ${match.round}) - will show TBA`);
        }

        console.log('   ✅ Database matches reset successfully');
      }

      console.log(`   ✅ Completed: ${draw.tournament.name} - ${draw.category.name}\n`);
    }

    console.log('\n🎉 All knockout stages have been reset!');
    console.log('📝 Summary:');
    console.log('   - Semi-finals: Players assigned, status PENDING, no scores');
    console.log('   - Finals: Players cleared (TBA), status PENDING');
    console.log('   - All matches ready to start fresh\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixKnockoutReset();
