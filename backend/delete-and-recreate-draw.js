import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAndRecreateDraw() {
  try {
    console.log('🗑️  DELETING OLD DRAW COMPLETELY...\n');

    // Find the draw
    const draw = await prisma.draw.findFirst({
      where: { format: 'ROUND_ROBIN_KNOCKOUT' }
    });

    if (!draw) {
      console.log('No draw found');
      return;
    }

    console.log('Found draw:', draw.id);
    console.log('Tournament:', draw.tournamentId);
    console.log('Category:', draw.categoryId);

    // Delete ALL matches for this category
    console.log('\n🗑️  Deleting all matches...');
    const deletedMatches = await prisma.match.deleteMany({
      where: {
        tournamentId: draw.tournamentId,
        categoryId: draw.categoryId
      }
    });
    console.log(`✅ Deleted ${deletedMatches.count} matches`);

    // Delete the draw
    console.log('\n🗑️  Deleting draw...');
    await prisma.draw.delete({
      where: { id: draw.id }
    });
    console.log('✅ Draw deleted');

    console.log('\n✅ EVERYTHING DELETED!');
    console.log('\n📝 Now you need to:');
    console.log('1. Go to the Draw page in your browser');
    console.log('2. Refresh the page (F5)');
    console.log('3. Create a new draw');
    console.log('4. Assign players using "Arrange Knockout Matchups"');
    console.log('5. Start fresh with no old data!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAndRecreateDraw();
