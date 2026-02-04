import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findAdityaDraw() {
  try {
    const draws = await prisma.draw.findMany({
      include: {
        tournament: { select: { name: true } },
        category: { select: { name: true } }
      }
    });

    console.log(`Searching ${draws.length} draws for "Aditya"...\n`);

    for (const draw of draws) {
      const bracketJson = typeof draw.bracketJson === 'string' 
        ? JSON.parse(draw.bracketJson) 
        : draw.bracketJson;

      const jsonString = JSON.stringify(bracketJson);
      
      if (jsonString.includes('Aditya')) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ FOUND "Aditya" in this draw:`);
        console.log(`Tournament: ${draw.tournament.name}`);
        console.log(`Category: ${draw.category.name}`);
        console.log(`Format: ${draw.format}`);
        console.log(`Draw ID: ${draw.id}`);
        console.log(`Created: ${draw.createdAt}`);
        console.log(`Updated: ${draw.updatedAt}`);
        
        // Check knockout section
        if (bracketJson.knockout?.rounds) {
          console.log('\nKnockout Matches:');
          bracketJson.knockout.rounds.forEach((round, idx) => {
            console.log(`\n  Round ${idx + 1}:`);
            round.matches.forEach((match, matchIdx) => {
              const p1 = match.player1?.name || 'NULL';
              const p2 = match.player2?.name || 'NULL';
              console.log(`    Match ${matchIdx + 1}: ${p1} vs ${p2}`);
              if (p1.includes('Aditya') || p2.includes('Aditya')) {
                console.log(`      ⚠️ ADITYA FOUND HERE!`);
              }
              if (match.winner || match.score1) {
                console.log(`      Winner: ${match.winner}, Score: ${match.score1}-${match.score2}`);
              }
            });
          });
        }
        
        // Check rounds section (for pure knockout)
        if (bracketJson.rounds) {
          console.log('\nKnockout Rounds:');
          bracketJson.rounds.forEach((round, idx) => {
            console.log(`\n  Round ${idx + 1}:`);
            round.matches.forEach((match, matchIdx) => {
              const p1 = match.player1?.name || 'NULL';
              const p2 = match.player2?.name || 'NULL';
              console.log(`    Match ${matchIdx + 1}: ${p1} vs ${p2}`);
              if (p1.includes('Aditya') || p2.includes('Aditya')) {
                console.log(`      ⚠️ ADITYA FOUND HERE!`);
              }
            });
          });
        }
      }
    }

    console.log('\n\nSearch complete.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAdityaDraw();
