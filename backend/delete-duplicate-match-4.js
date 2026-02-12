import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteDuplicateMatch4() {
  // Delete the duplicate Match #4 in Round 1 (Finals)
  const result = await prisma.match.delete({
    where: { id: '2e1b19d9-c8e7-4e5e-8e5e-8e5e8e5e8e5e' } // Replace with actual ID
  });

  console.log('Deleted duplicate Match #4:', result);

  await prisma.$disconnect();
}

// First, let's find the exact ID
async function findDuplicateMatch4() {
  const matches = await prisma.match.findMany({
    where: {
      tournamentId: '4a54977d-bfbc-42e0-96c3-b020000d81f6',
      categoryId: '68a7a3eb-1ba0-446e-9a0f-cf8597b8b748',
      matchNumber: 4,
      round: 1 // The duplicate is in Round 1 (Finals)
    }
  });

  if (matches.length > 0) {
    console.log('Found duplicate Match #4 in Round 1:');
    console.log('ID:', matches[0].id);
    
    // Delete it
    await prisma.match.delete({
      where: { id: matches[0].id }
    });
    
    console.log('✅ Deleted duplicate Match #4');
  } else {
    console.log('No duplicate found');
  }

  await prisma.$disconnect();
}

findDuplicateMatch4();
