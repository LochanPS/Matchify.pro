import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBracketJson() {
  try {
    const draws = await prisma.draw.findMany({
      include: {
        tournament: { select: { name: true } },
        category: { select: { name: true } }
      }
    });

    console.log(`Found ${draws.length} draws\n`);

    draws.forEach(draw => {
      console.log(`\n📋 ${draw.tournament.name} - ${draw.category.name}`);
      
      const bracketJson = typeof draw.bracketJson === 'string' 
        ? JSON.parse(draw.bracketJson) 
        : draw.bracketJson;

      console.log('Format:', bracketJson.format);
      console.log('Has knockout:', !!bracketJson.knockout);
      
      if (bracketJson.knockout) {
        console.log('Knockout structure:', JSON.stringify(bracketJson.knockout, null, 2));
      } else {
        console.log('❌ No knockout structure in bracketJson!');
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBracketJson();
