import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkMatches() {
  try {
    const matches = await prisma.match.findMany({
      take: 10,
      include: {
        tournament: { select: { name: true } },
        category: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n===========================================');
    console.log('MATCHES IN DATABASE');
    console.log('===========================================\n');
    console.log(`Total matches found: ${matches.length}\n`);

    if (matches.length === 0) {
      console.log('❌ No matches found in database!');
      console.log('\nYou need to:');
      console.log('1. Create a tournament');
      console.log('2. Add categories');
      console.log('3. Register players');
      console.log('4. Generate draws');
      console.log('\nOr run the seed script to create test data.');
    } else {
      matches.forEach((match, index) => {
        console.log(`${index + 1}. Match ID: ${match.id}`);
        console.log(`   Tournament: ${match.tournament.name}`);
        console.log(`   Category: ${match.category.name}`);
        console.log(`   Status: ${match.status}`);
        console.log(`   Round: ${match.round}`);
        console.log(`   Match Number: ${match.matchNumber}`);
        console.log(`   URL: http://localhost:5173/scoring/${match.id}`);
        console.log('');
      });

      console.log('\n===========================================');
      console.log('TO TEST SCORING:');
      console.log('===========================================');
      console.log(`\n1. Copy a match URL from above`);
      console.log(`2. Paste it in your browser`);
      console.log(`3. Click "Start Match"`);
      console.log(`4. Start scoring!\n`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMatches();
