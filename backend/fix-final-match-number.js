import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixFinalMatchNumber() {
  console.log('🔧 Changing Final match number from 999 to 7...\n');

  try {
    const finalMatch = await prisma.match.findFirst({
      where: {
        tournamentId: '4a54977d-bfbc-42e0-96c3-b020000d81f6',
        categoryId: '68a7a3eb-1ba0-446e-9a0f-cf8597b8b748',
        matchNumber: 999
      }
    });

    if (finalMatch) {
      await prisma.match.update({
        where: { id: finalMatch.id },
        data: { matchNumber: 7 }
      });

      console.log('✅ Changed Final match number from 999 to 7');
      console.log('\nNow all matches are numbered sequentially:');
      console.log('  Match #1-4: Quarter Finals');
      console.log('  Match #5-6: Semi Finals');
      console.log('  Match #7: Final');
    } else {
      console.log('❌ Final match #999 not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixFinalMatchNumber();
