import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function completeReset() {
  try {
    console.log('🧹 COMPLETE RESET - Deleting ALL matches for this draw...\n');

    const draw = await prisma.draw.findFirst({
      where: { format: 'ROUND_ROBIN_KNOCKOUT' }
    });

    if (!draw) {
      console.log('❌ No draw found');
      return;
    }

    console.log(`📋 Draw ID: ${draw.id}`);
    console.log(`🏆 Tournament ID: ${draw.tournamentId}`);
    console.log(`📂 Category ID: ${draw.categoryId}\n`);

    // Delete ALL matches for this tournament + category
    const deleted = await prisma.match.deleteMany({
      where: {
        tournamentId: draw.tournamentId,
        categoryId: draw.categoryId
      }
    });

    console.log(`✅ Deleted ${deleted.count} matches\n`);

    // Clear bracket JSON
    await prisma.draw.update({
      where: { id: draw.id },
      data: { bracketJson: '{}' }
    });

    console.log('✅ Cleared bracket JSON\n');

    // Verify
    const remaining = await prisma.match.count({
      where: {
        tournamentId: draw.tournamentId,
        categoryId: draw.categoryId
      }
    });

    console.log(`🔍 Remaining matches: ${remaining}`);
    
    if (remaining === 0) {
      console.log('\n✅ SUCCESS! All matches deleted. Draw is now completely fresh.\n');
      console.log('🔄 Now restart your frontend and backend\n');
    } else {
      console.log('\n⚠️ WARNING: Some matches still remain!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeReset();
