import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixKnockoutMatchNumbering() {
  try {
    console.log('🔧 Fixing Knockout Match Numbering System...\n');
    console.log('📋 New System: Each round starts from Match 1');
    console.log('   - Semi-Finals: Match 1, Match 2');
    console.log('   - Finals: Match 1\n');

    // Get all Round Robin + Knockout draws
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
      
      // Get all knockout matches
      const knockoutMatches = await prisma.match.findMany({
        where: {
          tournamentId: draw.tournamentId,
          categoryId: draw.categoryId,
          stage: 'KNOCKOUT'
        },
        orderBy: [
          { round: 'desc' }, // Higher round = earlier stage (semi-finals)
          { id: 'asc' }
        ]
      });

      console.log(`   📊 Found ${knockoutMatches.length} knockout matches`);

      // Group matches by round
      const matchesByRound = {};
      knockoutMatches.forEach(match => {
        if (!matchesByRound[match.round]) {
          matchesByRound[match.round] = [];
        }
        matchesByRound[match.round].push(match);
      });

      // Renumber matches within each round starting from 1
      const rounds = Object.keys(matchesByRound).sort((a, b) => b - a); // Descending order
      
      for (const round of rounds) {
        const matches = matchesByRound[round];
        console.log(`\n   🔄 Round ${round}: Renumbering ${matches.length} matches`);
        
        for (let i = 0; i < matches.length; i++) {
          const newMatchNumber = i + 1;
          const match = matches[i];
          
          await prisma.match.update({
            where: { id: match.id },
            data: { matchNumber: newMatchNumber }
          });
          
          const player1 = match.player1Id ? await prisma.user.findUnique({ 
            where: { id: match.player1Id }, 
            select: { name: true } 
          }) : null;
          const player2 = match.player2Id ? await prisma.user.findUnique({ 
            where: { id: match.player2Id }, 
            select: { name: true } 
          }) : null;
          
          console.log(`      ✓ Match ${newMatchNumber}: ${player1?.name || 'TBA'} vs ${player2?.name || 'TBA'}`);
        }
      }

      // Update bracket JSON to match
      const bracketJson = typeof draw.bracketJson === 'string' 
        ? JSON.parse(draw.bracketJson) 
        : draw.bracketJson;

      if (bracketJson.knockout && bracketJson.knockout.rounds) {
        console.log('\n   📝 Updating bracket JSON match numbers...');
        
        bracketJson.knockout.rounds.forEach((round, roundIdx) => {
          round.matches.forEach((match, matchIdx) => {
            match.matchNumber = matchIdx + 1;
          });
        });

        await prisma.draw.update({
          where: { id: draw.id },
          data: { 
            bracketJson: JSON.stringify(bracketJson),
            updatedAt: new Date()
          }
        });
        
        console.log('   ✅ Bracket JSON updated');
      }

      console.log(`   ✅ Completed: ${draw.tournament.name} - ${draw.category.name}`);
    }

    console.log('\n\n🎉 Match numbering fixed!');
    console.log('📋 New numbering system:');
    console.log('   - Each knockout round starts from Match 1');
    console.log('   - Semi-Finals: Match 1, Match 2, etc.');
    console.log('   - Finals: Match 1');
    console.log('   - Much clearer for users!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixKnockoutMatchNumbering();
