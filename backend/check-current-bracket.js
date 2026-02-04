import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBracket() {
  try {
    console.log('🔍 CHECKING CURRENT BRACKET STRUCTURE...\n');

    const draws = await prisma.draw.findMany({
      include: {
        tournament: { select: { name: true } },
        category: { select: { name: true } }
      }
    });

    for (const draw of draws) {
      console.log(`\n📊 Tournament: ${draw.tournament.name}`);
      console.log(`   Category: ${draw.category.name}`);
      console.log(`   Format: ${draw.format}`);
      
      let bracketJson = typeof draw.bracketJson === 'string' 
        ? JSON.parse(draw.bracketJson) 
        : draw.bracketJson;

      if (bracketJson.format === 'KNOCKOUT' && bracketJson.rounds) {
        console.log(`\n   Knockout Structure:`);
        console.log(`   - Bracket Size: ${bracketJson.bracketSize}`);
        console.log(`   - Total Rounds: ${bracketJson.rounds.length}`);
        
        bracketJson.rounds.forEach((round, idx) => {
          console.log(`\n   Round ${idx} (roundNumber: ${round.roundNumber}):`);
          console.log(`   - Matches: ${round.matches.length}`);
          round.matches.forEach((match, matchIdx) => {
            const p1 = match.player1?.name || 'Empty';
            const p2 = match.player2?.name || 'Empty';
            console.log(`     Match ${matchIdx + 1}: ${p1} vs ${p2}`);
          });
        });
      }
    }

    // Check database matches
    console.log(`\n\n📋 DATABASE MATCHES:`);
    const matches = await prisma.match.findMany({
      orderBy: [{ round: 'desc' }, { matchNumber: 'asc' }]
    });
    
    console.log(`   Total matches in database: ${matches.length}`);
    
    if (matches.length > 0) {
      const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => b - a);
      for (const round of rounds) {
        const roundMatches = matches.filter(m => m.round === round);
        console.log(`\n   Round ${round}: ${roundMatches.length} matches`);
        roundMatches.forEach(m => {
          console.log(`     Match ${m.matchNumber}: player1Id=${m.player1Id ? 'assigned' : 'null'}, player2Id=${m.player2Id ? 'assigned' : 'null'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBracket();
