import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getMatchId() {
  try {
    // Get first match
    const match = await prisma.match.findFirst({
      include: {
        tournament: { select: { name: true } },
        category: { select: { name: true } }
      }
    });

    if (match) {
      console.log('\n✅ Found a match!\n');
      console.log('Match ID:', match.id);
      console.log('Tournament:', match.tournament.name);
      console.log('Category:', match.category.name);
      console.log('Status:', match.status);
      console.log('\n🔗 Scoring Console Link:');
      console.log(`http://localhost:5173/scoring/${match.id}`);
      console.log('\n');
    } else {
      console.log('\n❌ No matches found in database');
      console.log('You need to create a tournament and generate draws first.\n');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getMatchId();
