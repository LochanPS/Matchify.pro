import prisma from './src/lib/prisma.js';

async function main() {
  const tournament = await prisma.tournament.findFirst({
    include: { categories: true }
  });

  const category = tournament.categories[0];
  
  const draw = await prisma.draw.findUnique({
    where: {
      tournamentId_categoryId: {
        tournamentId: tournament.id,
        categoryId: category.id
      }
    }
  });

  const bracketJson = JSON.parse(draw.bracketJson);
  
  console.log('🔍 KNOCKOUT BRACKET JSON STRUCTURE\n');
  console.log('Format:', bracketJson.format);
  console.log('Knockout Bracket Size:', bracketJson.knockout?.bracketSize);
  console.log('Knockout Rounds:', bracketJson.knockout?.rounds?.length);
  
  if (bracketJson.knockout && bracketJson.knockout.rounds) {
    console.log('\n📊 Knockout Structure:\n');
    
    bracketJson.knockout.rounds.forEach((round, roundIndex) => {
      console.log(`Round ${round.roundNumber}:`);
      console.log(`  Matches: ${round.matches.length}`);
      
      round.matches.forEach((match, matchIndex) => {
        console.log(`\n  Match ${match.matchNumber}:`);
        console.log(`    Player 1: ${match.player1?.name || 'NULL'} (ID: ${match.player1?.id || 'NULL'})`);
        console.log(`    Player 2: ${match.player2?.name || 'NULL'} (ID: ${match.player2?.id || 'NULL'})`);
        console.log(`    Status: ${match.status || 'NULL'}`);
      });
      
      console.log('');
    });
  }
  
  await prisma.$disconnect();
}

main();
