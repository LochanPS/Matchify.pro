import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixKnockoutParentRelationships() {
  try {
    console.log('🔧 Fixing knockout parent relationships...\n');

    // Find the ACE Badminton tournament
    const tournament = await prisma.tournament.findFirst({
      where: { name: { contains: 'ACE' } }
    });

    if (!tournament) {
      console.log('❌ Tournament not found');
      return;
    }

    console.log(`✅ Tournament: ${tournament.name}\n`);

    // Get MEN'S DOUBLES category
    const category = await prisma.category.findFirst({
      where: {
        tournamentId: tournament.id,
        name: "MEN'S DOUBLES"
      }
    });

    if (!category) {
      console.log('❌ Category not found');
      return;
    }

    console.log(`✅ Category: ${category.name}\n`);

    // Get all knockout matches
    const allKnockoutMatches = await prisma.match.findMany({
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

    console.log(`📊 Found ${allKnockoutMatches.length} knockout matches\n`);

    // Display current state
    console.log('Current state:');
    for (const match of allKnockoutMatches) {
      console.log(`  Match ${match.matchNumber} (Round ${match.round}): parentMatchId=${match.parentMatchId || 'NULL'}, winnerPosition=${match.winnerPosition || 'NULL'}`);
    }
    console.log('');

    // Set parent relationships
    console.log('🔗 Setting parent match relationships...\n');
    
    const rounds = [...new Set(allKnockoutMatches.map(m => m.round))].sort((a, b) => b - a);
    console.log(`Rounds found: ${rounds.join(', ')}\n`);
    
    for (const currentRound of rounds) {
      if (currentRound === 1) {
        console.log(`Skipping Round 1 (Finals) - no parent\n`);
        continue; // Skip final (no parent)
      }
      
      const roundMatches = allKnockoutMatches.filter(m => m.round === currentRound);
      const parentRound = currentRound - 1;
      const parentRoundMatches = allKnockoutMatches.filter(m => m.round === parentRound);
      
      console.log(`Processing Round ${currentRound} (${roundMatches.length} matches) → Parent Round ${parentRound} (${parentRoundMatches.length} matches)`);
      
      for (let i = 0; i < roundMatches.length; i++) {
        const match = roundMatches[i];
        const parentMatchIndex = Math.floor(i / 2);
        
        // Get parent match by index in the parent round, not by matchNumber
        const parentMatch = parentRoundMatches[parentMatchIndex];
        
        if (parentMatch) {
          const winnerPosition = i % 2 === 0 ? 'player1' : 'player2';
          
          await prisma.match.update({
            where: { id: match.id },
            data: {
              parentMatchId: parentMatch.id,
              winnerPosition: winnerPosition
            }
          });
          
          console.log(`  ✓ Match ${match.matchNumber} → Parent: Match ${parentMatch.matchNumber} as ${winnerPosition}`);
        } else {
          console.log(`  ⚠️  No parent found for Match ${match.matchNumber} (looking for parent at index ${parentMatchIndex})`);
        }
      }
      console.log('');
    }
    
    console.log('✅ Parent relationships fixed!\n');

    // Verify the fix
    console.log('Verification - Updated state:');
    const updatedMatches = await prisma.match.findMany({
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

    for (const match of updatedMatches) {
      const parent = match.parentMatchId 
        ? updatedMatches.find(m => m.id === match.parentMatchId)
        : null;
      console.log(`  Match ${match.matchNumber} (Round ${match.round}): parentMatchId=${parent ? `Match ${parent.matchNumber}` : 'NULL'}, winnerPosition=${match.winnerPosition || 'NULL'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixKnockoutParentRelationships();
