import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBracketJsonNow() {
  try {
    console.log('🔧 Fixing Bracket JSON - Clearing knockout player data...\n');

    const draw = await prisma.draw.findFirst({
      where: { format: 'ROUND_ROBIN_KNOCKOUT' }
    });

    if (!draw) {
      console.log('No draw found');
      return;
    }

    let bracketJson = typeof draw.bracketJson === 'string' 
      ? JSON.parse(draw.bracketJson) 
      : draw.bracketJson;

    console.log('BEFORE FIX:');
    if (bracketJson.knockout?.rounds) {
      bracketJson.knockout.rounds.forEach((round, idx) => {
        console.log(`  Round ${idx + 1}:`);
        round.matches.forEach((match, matchIdx) => {
          console.log(`    Match ${matchIdx + 1}: ${match.player1?.name || 'NULL'} vs ${match.player2?.name || 'NULL'}`);
        });
      });
    }

    // CLEAR ALL knockout player data
    if (bracketJson.knockout?.rounds) {
      bracketJson.knockout.rounds.forEach(round => {
        round.matches.forEach(match => {
          match.player1 = null;
          match.player2 = null;
          match.winner = null;
          match.winnerId = null;
          match.score1 = null;
          match.score2 = null;
          match.status = 'PENDING';
        });
      });
    }

    console.log('\nAFTER FIX:');
    if (bracketJson.knockout?.rounds) {
      bracketJson.knockout.rounds.forEach((round, idx) => {
        console.log(`  Round ${idx + 1}:`);
        round.matches.forEach((match, matchIdx) => {
          console.log(`    Match ${matchIdx + 1}: ${match.player1?.name || 'NULL'} vs ${match.player2?.name || 'NULL'}`);
        });
      });
    }

    // Save
    await prisma.draw.update({
      where: { id: draw.id },
      data: { 
        bracketJson: JSON.stringify(bracketJson),
        updatedAt: new Date()
      }
    });

    console.log('\n✅ Bracket JSON fixed!');
    console.log('🔄 Now refresh your browser (Ctrl+Shift+R)');
    console.log('   Knockout should show TBD vs TBD\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBracketJsonNow();
