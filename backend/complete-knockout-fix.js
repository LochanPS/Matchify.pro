import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function completeKnockoutFix() {
  try {
    console.log('🔧 COMPLETE KNOCKOUT FIX - Removing ALL old data...\n');

    const draw = await prisma.draw.findFirst({
      where: { format: 'ROUND_ROBIN_KNOCKOUT' }
    });

    if (!draw) {
      console.log('No draw found');
      return;
    }

    // Parse bracket
    let bracketJson = typeof draw.bracketJson === 'string' 
      ? JSON.parse(draw.bracketJson) 
      : draw.bracketJson;

    console.log('📋 BEFORE FIX - Knockout structure:');
    if (bracketJson.knockout?.rounds) {
      bracketJson.knockout.rounds.forEach((round, idx) => {
        console.log(`  Round ${idx + 1}:`);
        round.matches.forEach((match, matchIdx) => {
          console.log(`    Match ${matchIdx + 1}: ${match.player1?.name || 'NULL'} vs ${match.player2?.name || 'NULL'}`);
        });
      });
    }

    // STEP 1: COMPLETELY RECREATE the knockout structure from scratch
    console.log('\n🔨 Recreating knockout structure from scratch...');
    
    // Create a fresh knockout bracket for 4 players (2 semi-finals + 1 final)
    const freshKnockout = {
      format: 'KNOCKOUT',
      bracketSize: 4,
      totalParticipants: 0,
      rounds: [
        {
          roundNumber: 1,
          matches: [
            {
              matchNumber: 1,
              player1: { 
                id: '2692910d-8d7f-41b4-b0bd-535ca9ca5e6d', 
                name: 'Ananya Iyer', 
                seed: 1 
              },
              player2: { 
                id: '5b3b57f0-3a4f-43de-a34b-9f999426c01f', 
                name: 'Akash Pandey', 
                seed: 2 
              },
              score1: null,
              score2: null,
              winner: null,
              winnerId: null,
              status: 'PENDING'
            },
            {
              matchNumber: 2,
              player1: { 
                id: 'f72cc336-ad37-4061-af4a-6ad8353b8d1b', 
                name: 'Arjun Mehta', 
                seed: 1 
              },
              player2: { 
                id: 'c4e8810c-3f73-4a68-accc-8a50333f02f8', 
                name: 'Divya Gupta', 
                seed: 2 
              },
              score1: null,
              score2: null,
              winner: null,
              winnerId: null,
              status: 'PENDING'
            }
          ]
        },
        {
          roundNumber: 2,
          matches: [
            {
              matchNumber: 1,
              player1: null,
              player2: null,
              score1: null,
              score2: null,
              winner: null,
              winnerId: null,
              status: 'PENDING'
            }
          ]
        }
      ]
    };

    // Replace the knockout section completely
    bracketJson.knockout = freshKnockout;

    console.log('\n✅ AFTER FIX - New knockout structure:');
    bracketJson.knockout.rounds.forEach((round, idx) => {
      console.log(`  Round ${idx + 1}:`);
      round.matches.forEach((match, matchIdx) => {
        console.log(`    Match ${match.matchNumber}: ${match.player1?.name || 'NULL'} vs ${match.player2?.name || 'NULL'}`);
        console.log(`      Status: ${match.status}, Winner: ${match.winner || 'NULL'}`);
      });
    });

    // STEP 2: Save to database
    console.log('\n💾 Saving to database...');
    await prisma.draw.update({
      where: { id: draw.id },
      data: { 
        bracketJson: JSON.stringify(bracketJson),
        updatedAt: new Date()
      }
    });

    // STEP 3: Update database matches
    console.log('💾 Updating database match records...');
    
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

    // Reset ALL
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

    // Assign to semi-finals
    const maxRound = Math.max(...knockoutMatches.map(m => m.round));
    const semiFinalsMatches = knockoutMatches.filter(m => m.round === maxRound);

    const correctMatchups = [
      {
        player1Id: '2692910d-8d7f-41b4-b0bd-535ca9ca5e6d',
        player2Id: '5b3b57f0-3a4f-43de-a34b-9f999426c01f'
      },
      {
        player1Id: 'f72cc336-ad37-4061-af4a-6ad8353b8d1b',
        player2Id: 'c4e8810c-3f73-4a68-accc-8a50333f02f8'
      }
    ];

    for (let i = 0; i < correctMatchups.length && i < semiFinalsMatches.length; i++) {
      await prisma.match.update({
        where: { id: semiFinalsMatches[i].id },
        data: {
          player1Id: correctMatchups[i].player1Id,
          player2Id: correctMatchups[i].player2Id,
          status: 'PENDING'
        }
      });
    }

    console.log('\n✅ COMPLETE FIX DONE!');
    console.log('\n📊 Final State:');
    console.log('  Semi-Finals Match 1: Ananya Iyer vs Akash Pandey');
    console.log('  Semi-Finals Match 2: Arjun Mehta vs Divya Gupta');
    console.log('  Finals Match 1: TBA vs TBA');
    console.log('\n🔄 Now do a HARD REFRESH: Ctrl+Shift+R');
    console.log('   Or close and reopen your browser completely');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeKnockoutFix();
