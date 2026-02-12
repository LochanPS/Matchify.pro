import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceFixKnockout() {
  try {
    console.log('🔧 FORCE FIXING Knockout Stage...\n');

    const draw = await prisma.draw.findFirst({
      where: { format: 'ROUND_ROBIN_KNOCKOUT' },
      include: {
        tournament: { select: { name: true } },
        category: { select: { name: true } }
      }
    });

    if (!draw) {
      console.log('No draw found');
      return;
    }

    console.log(`Tournament: ${draw.tournament.name} - ${draw.category.name}\n`);

    // Parse bracket
    let bracketJson = typeof draw.bracketJson === 'string' 
      ? JSON.parse(draw.bracketJson) 
      : draw.bracketJson;

    // Define the CORRECT matchups
    const correctMatchups = [
      {
        player1: { id: '2692910d-8d7f-41b4-b0bd-535ca9ca5e6d', name: 'Ananya Iyer', seed: 1 },
        player2: { id: '5b3b57f0-3a4f-43de-a34b-9f999426c01f', name: 'Akash Pandey', seed: 2 }
      },
      {
        player1: { id: 'f72cc336-ad37-4061-af4a-6ad8353b8d1b', name: 'Arjun Mehta', seed: 1 },
        player2: { id: 'c4e8810c-3f73-4a68-accc-8a50333f02f8', name: 'Divya Gupta', seed: 2 }
      }
    ];

    console.log('✅ Setting CORRECT matchups:');
    correctMatchups.forEach((match, idx) => {
      console.log(`  Match ${idx + 1}: ${match.player1.name} vs ${match.player2.name}`);
    });

    // STEP 1: Reset ALL knockout rounds
    console.log('\n🧹 Resetting ALL knockout data...');
    for (const round of bracketJson.knockout.rounds) {
      for (const match of round.matches) {
        match.player1 = null;
        match.player2 = null;
        match.winner = null;
        match.winnerId = null;
        match.score1 = null;
        match.score2 = null;
        match.status = 'PENDING';
      }
    }

    // STEP 2: Assign CORRECT players to first round (semi-finals)
    console.log('📝 Assigning correct players to semi-finals...');
    if (bracketJson.knockout.rounds[0]) {
      const firstRound = bracketJson.knockout.rounds[0].matches;
      correctMatchups.forEach((matchup, index) => {
        if (firstRound[index]) {
          firstRound[index].player1 = matchup.player1;
          firstRound[index].player2 = matchup.player2;
          firstRound[index].status = 'PENDING';
          firstRound[index].matchNumber = index + 1;
          firstRound[index].winner = null;
          firstRound[index].winnerId = null;
          firstRound[index].score1 = null;
          firstRound[index].score2 = null;
        }
      });
    }

    // STEP 3: Save to database
    console.log('\n💾 Saving to database...');
    await prisma.draw.update({
      where: { id: draw.id },
      data: { 
        bracketJson: JSON.stringify(bracketJson),
        updatedAt: new Date()
      }
    });

    // STEP 4: Update database matches
    console.log('💾 Updating database match records...');
    
    // Get all knockout matches
    const knockoutMatches = await prisma.match.findMany({
      where: {
        tournamentId: draw.tournamentId,
        categoryId: draw.categoryId,
        stage: 'KNOCKOUT'
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });

    console.log(`Found ${knockoutMatches.length} knockout matches`);

    // Reset ALL knockout matches
    for (const match of knockoutMatches) {
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
    }

    // Assign players to semi-finals (Round 2)
    const maxRound = Math.max(...knockoutMatches.map(m => m.round));
    const semiFinalsMatches = knockoutMatches.filter(m => m.round === maxRound);

    console.log(`\nAssigning players to ${semiFinalsMatches.length} semi-final matches (Round ${maxRound}):`);
    
    for (let i = 0; i < correctMatchups.length && i < semiFinalsMatches.length; i++) {
      const matchup = correctMatchups[i];
      const dbMatch = semiFinalsMatches[i];
      
      await prisma.match.update({
        where: { id: dbMatch.id },
        data: {
          player1Id: matchup.player1.id,
          player2Id: matchup.player2.id,
          status: 'PENDING'
        }
      });
      
      console.log(`  ✓ Match ${i + 1}: ${matchup.player1.name} vs ${matchup.player2.name}`);
    }

    console.log('\n✅ FORCE FIX COMPLETE!');
    console.log('\n📊 Final State:');
    console.log('  Semi-Finals:');
    console.log('    Match 1: Ananya Iyer vs Akash Pandey (PENDING)');
    console.log('    Match 2: Arjun Mehta vs Divya Gupta (PENDING)');
    console.log('  Finals:');
    console.log('    Match 1: TBA vs TBA (PENDING)');
    console.log('\n🔄 Now refresh your browser with Ctrl+Shift+R');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceFixKnockout();
