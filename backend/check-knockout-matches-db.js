import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkKnockoutMatches() {
  try {
    console.log('🔍 Checking knockout matches in database...\n');

    // Find the ACE tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: {
          contains: 'ace',
          mode: 'insensitive'
        }
      },
      include: {
        categories: true
      }
    });

    if (!tournament) {
      console.log('❌ No ACE tournament found');
      return;
    }

    console.log(`✅ Found tournament: ${tournament.name} (${tournament.id})`);
    console.log(`   Categories: ${tournament.categories.length}\n`);

    for (const category of tournament.categories) {
      console.log(`\n📋 Category: ${category.name} (${category.id})`);
      console.log(`   Format: ${category.format}`);

      // Get all matches for this category
      const matches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          categoryId: category.id
        },
        orderBy: [
          { stage: 'asc' },
          { round: 'desc' },
          { matchNumber: 'asc' }
        ]
      });

      console.log(`   Total matches: ${matches.length}\n`);

      // Fetch player details separately
      const matchesWithPlayers = await Promise.all(
        matches.map(async (match) => {
          const player1 = match.player1Id
            ? await prisma.user.findUnique({
                where: { id: match.player1Id },
                select: { id: true, name: true }
              })
            : null;

          const player2 = match.player2Id
            ? await prisma.user.findUnique({
                where: { id: match.player2Id },
                select: { id: true, name: true }
              })
            : null;

          const winner = match.winnerId
            ? await prisma.user.findUnique({
                where: { id: match.winnerId },
                select: { id: true, name: true }
              })
            : null;

          return {
            ...match,
            player1,
            player2,
            winner
          };
        })
      );

      // Group by stage
      const roundRobinMatches = matchesWithPlayers.filter(m => m.stage === 'ROUND_ROBIN');
      const knockoutMatches = matchesWithPlayers.filter(m => m.stage === 'KNOCKOUT');

      if (roundRobinMatches.length > 0) {
        console.log(`   🔄 ROUND ROBIN MATCHES: ${roundRobinMatches.length}`);
        roundRobinMatches.forEach(m => {
          console.log(`      Match ${m.matchNumber} (Round ${m.round}): ${m.player1?.name || 'TBD'} vs ${m.player2?.name || 'TBD'} - ${m.status}`);
        });
        console.log('');
      }

      if (knockoutMatches.length > 0) {
        console.log(`   🏆 KNOCKOUT MATCHES: ${knockoutMatches.length}`);
        
        // Group by round
        const rounds = [...new Set(knockoutMatches.map(m => m.round))].sort((a, b) => b - a);
        
        rounds.forEach(round => {
          const roundMatches = knockoutMatches.filter(m => m.round === round);
          const roundName = round === 1 ? 'Final' : round === 2 ? 'Semi Finals' : round === 3 ? 'Quarter Finals' : `Round ${round}`;
          
          console.log(`\n      ${roundName} (Round ${round}):`);
          roundMatches.forEach(m => {
            console.log(`         Match ${m.matchNumber}: ${m.player1?.name || 'TBD'} vs ${m.player2?.name || 'TBD'}`);
            console.log(`            Status: ${m.status}`);
            console.log(`            Player1 ID: ${m.player1Id || 'NULL'}`);
            console.log(`            Player2 ID: ${m.player2Id || 'NULL'}`);
            console.log(`            Winner ID: ${m.winnerId || 'NULL'}`);
            if (m.parentMatchId) {
              console.log(`            Parent Match: ${m.parentMatchId} (position: ${m.winnerPosition})`);
            } else {
              console.log(`            Parent Match: NONE`);
            }
          });
        });
      }

      // Check draw bracket JSON
      const draw = await prisma.draw.findFirst({
        where: {
          tournamentId: tournament.id,
          categoryId: category.id
        }
      });

      if (draw && draw.bracketJson) {
        const bracketJson = typeof draw.bracketJson === 'string' 
          ? JSON.parse(draw.bracketJson) 
          : draw.bracketJson;

        if (bracketJson.knockout) {
          console.log(`\n   📊 BRACKET JSON - Knockout Structure:`);
          console.log(`      Total Rounds: ${bracketJson.knockout.rounds.length}`);
          console.log(`      Bracket Size: ${bracketJson.knockout.bracketSize}`);
          
          bracketJson.knockout.rounds.forEach((round, idx) => {
            console.log(`\n      Round ${idx} (${round.name}):`);
            round.matches.forEach((match, matchIdx) => {
              console.log(`         Match ${match.matchNumber}: ${match.player1?.name || 'TBD'} vs ${match.player2?.name || 'TBD'}`);
              if (match.player1) {
                console.log(`            Player1 ID in JSON: ${match.player1.id}`);
              }
              if (match.player2) {
                console.log(`            Player2 ID in JSON: ${match.player2.id}`);
              }
            });
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkKnockoutMatches();
