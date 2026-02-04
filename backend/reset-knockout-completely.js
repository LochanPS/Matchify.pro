import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetKnockout() {
  try {
    console.log('🧹 Resetting knockout stage completely...\n');

    // Find all draws for this tournament/category
    const draws = await prisma.draw.findMany({
      where: {
        tournament: { name: 'ace badminton' },
        category: { name: 'mens' }
      },
      include: {
        tournament: true,
        category: true
      }
    });

    if (draws.length === 0) {
      console.log('❌ No draws found');
      return;
    }

    console.log(`📋 Found ${draws.length} draws\n`);

    for (const draw of draws) {
      console.log(`\n🔍 Processing: ${draw.tournament.name} - ${draw.category.name}`);
      
      const bracketJson = typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson;
      console.log('   Format:', bracketJson.format);

      if (bracketJson.format !== 'ROUND_ROBIN_KNOCKOUT') {
        console.log('   ⏭️  Skipping (not ROUND_ROBIN_KNOCKOUT)');
        continue;
      }

      // STEP 1: Delete all KNOCKOUT matches from database
      const deleted = await prisma.match.deleteMany({
        where: {
          tournamentId: draw.tournamentId,
          categoryId: draw.categoryId,
          stage: 'KNOCKOUT'
        }
      });

      console.log('   ✅ Deleted', deleted.count, 'KNOCKOUT matches from database');

      // STEP 2: Remove knockout structure from bracketJson
      delete bracketJson.knockout;

      await prisma.draw.update({
        where: { id: draw.id },
        data: { bracketJson: JSON.stringify(bracketJson) }
      });

      console.log('   ✅ Removed knockout structure from bracketJson');
    }

    console.log('\n🎯 Knockout stage completely reset!');
    console.log('   Now you can arrange knockout matchups fresh.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetKnockout();
