import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixParentRelationships() {
  try {
    console.log('🔧 Fixing parent match relationships...\n');

    // Find the ACE tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: {
          contains: 'ace',
          mode: 'insensitive'
        }
      }
    });

    if (!tournament) {
      console.log('❌ No ACE tournament found');
      return;
    }

    console.log(`✅ Found tournament: ${tournament.name} (${tournament.id})\n`);

    // Get the mens category
    const category = await prisma.category.findFirst({
      where: {
        tournamentId: tournament.id,
        name: 'mens'
      }
    });

    if (!category) {
      console.log('❌ No mens category found');
      return;
    }

    console.log(`✅ Found category: ${category.name} (${category.id})\n`);

    // Get all knockout matches
    const knockoutMatches = await prisma.match.findMany({
      where: {
        tournamentId: tournament.id,
        categoryId: category.id,
        stage: 'KNOCKOUT'
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });

    console.log(`📊 Found ${knockoutMatches.length} knockout matches\n`);

    // Group by round
    const rounds = [...new Set(knockoutMatches.map(m => m.round))].sort((a, b) => b - a);
    
    console.log('🔗 Setting parent relationships...\n');

    // For each round (except final), set parent relationships
    for (const currentRound of rounds) {
      if (currentRound === 1) {
        console.log(`   Round ${currentRound} (Final): No parent needed\n`);
        continue; // Skip final (no parent)
      }
      
      const roundMatches = knockoutMatches.filter(m => m.round === currentRound);
      const parentRound = currentRound - 1;
      const parentMatches = knockoutMatches.filter(m => m.round === parentRound);
      
      const roundName = currentRound === 3 ? 'Quarter Finals' : currentRound === 2 ? 'Semi Finals' : `Round ${currentRound}`;
      const parentRoundName = parentRound === 2 ? 'Semi Finals' : parentRound === 1 ? 'Final' : `Round ${parentRound}`;
      
      console.log(`   ${roundName} (Round ${currentRound}) → ${parentRoundName} (Round ${parentRound}):`);
      
      for (let i = 0; i < roundMatches.length; i++) {
        const match = roundMatches[i];
        const parentMatchIndex = Math.floor(i / 2);
        const parentMatch = parentMatches[parentMatchIndex];
        
        if (parentMatch) {
          const winnerPosition = i % 2 === 0 ? 'player1' : 'player2';
          
          await prisma.match.update({
            where: { id: match.id },
            data: {
              parentMatchId: parentMatch.id,
              winnerPosition: winnerPosition
            }
          });
          
          console.log(`      ✓ Match ${match.matchNumber} → Parent Match ${parentMatch.matchNumber} as ${winnerPosition}`);
        }
      }
      console.log('');
    }

    console.log('✅ Parent relationships set!\n');

    // Re-fetch matches with updated parent relationships
    const updatedKnockoutMatches = await prisma.match.findMany({
      where: {
        tournamentId: tournament.id,
        categoryId: category.id,
        stage: 'KNOCKOUT'
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });

    // Now advance winners from completed matches
    console.log('🏆 Advancing winners from completed matches...\n');

    const completedMatches = updatedKnockoutMatches.filter(m => m.status === 'COMPLETED' && m.winnerId);
    
    for (const match of completedMatches) {
      if (match.parentMatchId && match.winnerPosition) {
        const updateData = match.winnerPosition === 'player1'
          ? { player1Id: match.winnerId }
          : { player2Id: match.winnerId };
        
        // Check if parent match now has both players
        const parentMatch = await prisma.match.findUnique({
          where: { id: match.parentMatchId }
        });

        if (parentMatch) {
          const bothPlayersReady = 
            (match.winnerPosition === 'player1' && parentMatch.player2Id) ||
            (match.winnerPosition === 'player2' && parentMatch.player1Id);

          if (bothPlayersReady) {
            updateData.status = 'READY';
          }
        }
        
        await prisma.match.update({
          where: { id: match.parentMatchId },
          data: updateData
        });

        const winner = await prisma.user.findUnique({
          where: { id: match.winnerId },
          select: { name: true }
        });

        console.log(`   ✓ ${winner.name} advanced to Match ${parentMatch.matchNumber} as ${match.winnerPosition}${updateData.status === 'READY' ? ' (READY)' : ''}`);
      }
    }

    console.log('\n✅ All done! Winners advanced to next round.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixParentRelationships();
