import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testArrangeKnockoutSave() {
  try {
    console.log('🧪 Testing Arrange Knockout Save Process...\n');

    // Get the draw
    const draw = await prisma.draw.findFirst({
      where: { format: 'ROUND_ROBIN_KNOCKOUT' }
    });

    if (!draw) {
      console.log('No draw found');
      return;
    }

    console.log('Current Draw ID:', draw.id);
    console.log('Last Updated:', draw.updatedAt);

    // Simulate the save request
    const knockoutSlots = [
      {
        matchNumber: 1,
        player1: { id: '2692910d-8d7f-41b4-b0bd-535ca9ca5e6d', name: 'Ananya Iyer' },
        player2: { id: '5b3b57f0-3a4f-43de-a34b-9f999426c01f', name: 'Akash Pandey' }
      },
      {
        matchNumber: 2,
        player1: { id: 'f72cc336-ad37-4061-af4a-6ad8353b8d1b', name: 'Arjun Mehta' },
        player2: { id: 'c4e8810c-3f73-4a68-accc-8a50333f02f8', name: 'Divya Gupta' }
      }
    ];

    console.log('\n📝 Simulating save with these matchups:');
    knockoutSlots.forEach(slot => {
      console.log(`  Match ${slot.matchNumber}: ${slot.player1.name} vs ${slot.player2.name}`);
    });

    // Parse current bracket
    let bracketJson = typeof draw.bracketJson === 'string' 
      ? JSON.parse(draw.bracketJson) 
      : draw.bracketJson;

    console.log('\n🔍 BEFORE UPDATE:');
    if (bracketJson.knockout?.rounds) {
      bracketJson.knockout.rounds.forEach((round, idx) => {
        console.log(`  Round ${idx + 1}:`);
        round.matches.forEach((match, matchIdx) => {
          console.log(`    Match ${matchIdx + 1}: ${match.player1?.name || 'NULL'} vs ${match.player2?.name || 'NULL'}`);
        });
      });
    }

    // STEP 1: Reset ALL knockout matches in bracketJson
    console.log('\n🧹 Resetting all knockout matches...');
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

    // STEP 2: Assign players to first round
    console.log('📝 Assigning players to first round...');
    if (bracketJson.knockout.rounds[0]) {
      const firstRound = bracketJson.knockout.rounds[0].matches;
      knockoutSlots.forEach((slot, index) => {
        if (firstRound[index]) {
          firstRound[index].player1 = slot.player1;
          firstRound[index].player2 = slot.player2;
          firstRound[index].status = 'PENDING';
          firstRound[index].matchNumber = slot.matchNumber || index + 1;
        }
      });
    }

    console.log('\n✅ AFTER UPDATE:');
    if (bracketJson.knockout?.rounds) {
      bracketJson.knockout.rounds.forEach((round, idx) => {
        console.log(`  Round ${idx + 1}:`);
        round.matches.forEach((match, matchIdx) => {
          console.log(`    Match ${match.matchNumber || matchIdx + 1}: ${match.player1?.name || 'NULL'} vs ${match.player2?.name || 'NULL'}`);
          console.log(`      Status: ${match.status}, Winner: ${match.winner || 'NULL'}`);
        });
      });
    }

    // Save to database
    console.log('\n💾 Saving to database...');
    await prisma.draw.update({
      where: { id: draw.id },
      data: { 
        bracketJson: JSON.stringify(bracketJson),
        updatedAt: new Date()
      }
    });

    console.log('✅ Saved successfully!');

    // Verify
    const updated = await prisma.draw.findUnique({ where: { id: draw.id } });
    const verifyBracket = JSON.parse(updated.bracketJson);
    
    console.log('\n🔍 VERIFICATION - Reading from database:');
    verifyBracket.knockout.rounds.forEach((round, idx) => {
      console.log(`  Round ${idx + 1}:`);
      round.matches.forEach((match, matchIdx) => {
        console.log(`    Match ${match.matchNumber || matchIdx + 1}: ${match.player1?.name || 'NULL'} vs ${match.player2?.name || 'NULL'}`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testArrangeKnockoutSave();
