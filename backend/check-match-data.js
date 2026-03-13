import prisma from './src/lib/prisma.js';

async function checkMatchData() {
  try {
    const match = await prisma.match.findUnique({
      where: { id: '651e18e4-a868-491d-8928-efd4a31414d2' },
      select: { 
        id: true,
        tournamentId: true,
        categoryId: true,
        status: true,
        winnerId: true,
        player1Id: true,
        player2Id: true
      }
    });

    if (match) {
      console.log('Match found:');
      console.log('  ID:', match.id);
      console.log('  Tournament ID:', match.tournamentId);
      console.log('  Category ID:', match.categoryId);
      console.log('  Status:', match.status);
      console.log('  Winner ID:', match.winnerId);
      
      // Now check if draw exists for this category
      const draw = await prisma.draw.findUnique({
        where: { 
          tournamentId_categoryId: { 
            tournamentId: match.tournamentId, 
            categoryId: match.categoryId 
          } 
        },
        select: { bracketJson: true }
      });

      if (draw) {
        const bracketJson = typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson;
        console.log('\nDraw found!');
        console.log('  Format:', bracketJson.format);
        console.log('  Groups:', bracketJson.groups?.length || 0);
        
        if (bracketJson.groups && bracketJson.groups.length > 0) {
          console.log('\n  Group A participants:');
          bracketJson.groups[0].participants.forEach(p => {
            console.log(`    - ${p.name}: ${p.points}pts (${p.wins}W-${p.losses}L, ${p.played}P)`);
          });
        }
      } else {
        console.log('\nDraw NOT found for this category!');
      }
    } else {
      console.log('Match not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMatchData();
