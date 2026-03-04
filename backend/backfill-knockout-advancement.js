import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillKnockoutAdvancement() {
  try {
    console.log('🔄 Backfilling knockout winner advancement...\n');

    // Find the ACE Badminton tournament
    const tournament = await prisma.tournament.findFirst({
      where: { name: { contains: 'ACE' } }
    });

    if (!tournament) {
      console.log('❌ Tournament not found');
      return;
    }

    console.log(`✅ Tournament: ${tournament.name}\n`);

    // Get all categories
    const categories = await prisma.category.findMany({
      where: { tournamentId: tournament.id }
    });

    for (const category of categories) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Processing: ${category.name}`);
      console.log(`${'='.repeat(80)}\n`);

      // Get the draw
      const draw = await prisma.draw.findUnique({
        where: {
          tournamentId_categoryId: {
            tournamentId: tournament.id,
            categoryId: category.id
          }
        }
      });

      if (!draw) {
        console.log(`⚠️  No draw found for ${category.name}`);
        continue;
      }

      const bracketJson = typeof draw.bracketJson === 'string' 
        ? JSON.parse(draw.bracketJson) 
        : draw.bracketJson;

      // Get all completed knockout matches
      const completedMatches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          categoryId: category.id,
          status: 'COMPLETED',
          stage: 'KNOCKOUT'
        },
        orderBy: {
          round: 'desc' // Process from later rounds to earlier (finals first, then semis, etc.)
        }
      });

      console.log(`Found ${completedMatches.length} completed knockout matches`);

      if (completedMatches.length === 0) {
        console.log('No completed knockout matches to process');
        continue;
      }

      let advancedCount = 0;
      let needsUpdate = false;

      // Determine which bracket structure to use
      const knockoutRounds = bracketJson.format === 'ROUND_ROBIN_KNOCKOUT' 
        ? bracketJson.knockout?.rounds 
        : bracketJson.rounds;

      if (!knockoutRounds) {
        console.log('No knockout rounds found in bracket');
        continue;
      }

      // Process each completed match
      for (const match of completedMatches) {
        if (!match.parentMatchId || !match.winnerId) {
          continue;
        }

        // Get parent match info
        const parentMatch = await prisma.match.findUnique({
          where: { id: match.parentMatchId }
        });

        if (!parentMatch) {
          continue;
        }

        // Get winner name
        let winnerName = 'Winner';
        if (match.winnerId.startsWith('guest-')) {
          const regId = match.winnerId.replace('guest-', '');
          const reg = await prisma.registration.findUnique({
            where: { id: regId },
            select: { guestName: true }
          });
          winnerName = reg?.guestName || 'Winner';
        } else {
          const user = await prisma.user.findUnique({
            where: { id: match.winnerId },
            select: { name: true }
          });
          winnerName = user?.name || 'Winner';
        }

        // Find parent match in bracket JSON by round
        // Database rounds are reversed: Round 1 = Finals, Round 2 = Semi-finals
        // Bracket JSON rounds are normal: Round 0 = Semi-finals, Round 1 = Finals
        const totalRounds = knockoutRounds.length;
        const bracketRoundIndex = totalRounds - parentMatch.round;
        
        if (bracketRoundIndex < 0 || bracketRoundIndex >= knockoutRounds.length) {
          console.log(`⚠️  Invalid bracket round index ${bracketRoundIndex} for parent match (DB round ${parentMatch.round})`);
          continue;
        }
        
        const bracketRound = knockoutRounds[bracketRoundIndex];
        
        // Get all matches in parent's round from database to find the position
        const parentRoundMatches = await prisma.match.findMany({
          where: {
            tournamentId: tournament.id,
            categoryId: category.id,
            stage: 'KNOCKOUT',
            round: parentMatch.round
          },
          orderBy: { matchNumber: 'asc' }
        });
        
        // Find parent match position in its round (0-indexed)
        const parentPositionInRound = parentRoundMatches.findIndex(m => m.id === parentMatch.id);
        
        if (parentPositionInRound === -1 || parentPositionInRound >= bracketRound.matches.length) {
          console.log(`⚠️  Could not find parent match position (found index ${parentPositionInRound}, bracket has ${bracketRound.matches.length} matches)`);
          continue;
        }
        
        const parentMatchInBracket = bracketRound.matches[parentPositionInRound];

        if (!parentMatchInBracket) {
          console.log(`⚠️  Could not find parent match at position ${parentPositionInRound} in bracket`);
          continue;
        }

        // Check if winner needs to be advanced in DATABASE (not just bracket JSON)
        const winnerData = {
          id: match.winnerId,
          name: winnerName
        };

        // Check database parent match to see if winner is already advanced
        const currentParentMatch = await prisma.match.findUnique({
          where: { id: parentMatch.id },
          select: { player1Id: true, player2Id: true, status: true }
        });

        if (match.winnerPosition === 'player1') {
          if (currentParentMatch.player1Id !== match.winnerId) {
            // Update bracket JSON
            parentMatchInBracket.player1 = winnerData;
            
            // Update database Match table
            await prisma.match.update({
              where: { id: parentMatch.id },
              data: { player1Id: match.winnerId }
            });
            
            console.log(`✅ Advanced ${winnerName} to DB Match ${parentMatch.matchNumber} (Bracket Round ${bracketRoundIndex}, Position ${parentPositionInRound}) as player1`);
            advancedCount++;
            needsUpdate = true;
          }
        } else if (match.winnerPosition === 'player2') {
          if (currentParentMatch.player2Id !== match.winnerId) {
            // Update bracket JSON
            parentMatchInBracket.player2 = winnerData;
            
            // Update database Match table
            await prisma.match.update({
              where: { id: parentMatch.id },
              data: { player2Id: match.winnerId }
            });
            
            console.log(`✅ Advanced ${winnerName} to DB Match ${parentMatch.matchNumber} (Bracket Round ${bracketRoundIndex}, Position ${parentPositionInRound}) as player2`);
            advancedCount++;
            needsUpdate = true;
          }
        }

        // Update parent match status if both players are assigned
        const updatedParentMatch = await prisma.match.findUnique({
          where: { id: parentMatch.id },
          select: { player1Id: true, player2Id: true }
        });
        
        if (updatedParentMatch.player1Id && updatedParentMatch.player2Id) {
          parentMatchInBracket.status = 'ready';
          
          // Update database status
          await prisma.match.update({
            where: { id: parentMatch.id },
            data: { status: 'READY' }
          });
        }
      }

      // Save updated bracket JSON if changes were made
      if (needsUpdate) {
        await prisma.draw.update({
          where: {
            tournamentId_categoryId: {
              tournamentId: tournament.id,
              categoryId: category.id
            }
          },
          data: {
            bracketJson: JSON.stringify(bracketJson),
            updatedAt: new Date()
          }
        });

        console.log(`\n✅ Advanced ${advancedCount} winners in ${category.name}`);
      } else {
        console.log(`\nNo advancement needed for ${category.name}`);
      }
    }

    console.log('\n\n🎉 Knockout advancement backfill complete!');
    console.log('Refresh your draw page to see the advanced winners.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillKnockoutAdvancement();
