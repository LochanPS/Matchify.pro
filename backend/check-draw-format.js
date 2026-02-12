import prisma from './src/lib/prisma.js';

async function main() {
  const t = await prisma.tournament.findFirst({ include: { categories: true } });
  const d = await prisma.draw.findUnique({ 
    where: { 
      tournamentId_categoryId: { 
        tournamentId: t.id, 
        categoryId: t.categories[0].id 
      } 
    } 
  });
  
  const b = JSON.parse(d.bracketJson);
  console.log('Draw Format:', b.format);
  console.log('Number of Groups:', b.numberOfGroups || 'N/A');
  console.log('Advance from Group:', b.advanceFromGroup || 'N/A');
  console.log('Has Knockout:', !!b.knockout);
  
  await prisma.$disconnect();
}

main();
