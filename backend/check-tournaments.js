import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTournaments() {
  const tournaments = await prisma.tournament.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      categories: {
        select: {
          id: true,
          name: true,
          registrationCount: true
        }
      }
    }
  });
  
  console.log('📋 All Tournaments:\n');
  tournaments.forEach(t => {
    console.log(`Tournament: ${t.name}`);
    console.log(`  ID: ${t.id}`);
    console.log(`  Status: ${t.status}`);
    console.log(`  Categories: ${t.categories.length}`);
    t.categories.forEach(c => {
      console.log(`    - ${c.name} (${c.registrationCount} registered)`);
    });
    console.log('');
  });
  
  await prisma.$disconnect();
}

checkTournaments();
