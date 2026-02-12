import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAndRecreateKnockout() {
  try {
    console.log('🗑️  DELETING all knockout matches...\n');

    // Delete all knockout matches
    const deleted = await prisma.match.deleteMany({
      where: { stage: 'KNOCKOUT' }
    });

    console.log(`✅ Deleted ${deleted.count} knockout matches\n`);

    // Reset bracketJson to remove knockout data
    const draws = await prisma.draw.findMany({
      include: {
        tournament: { select: { name: true } },
        category: { select: { name: true } }
      }
    });

    for (const draw of draws) {
      const bracketJson = typeof draw.bracketJson === 'string' 
        ? JSON.parse(draw.bracketJson) 
        : draw.bracketJson;

      if (bracketJson.format === 'ROUND_ROBIN_KNOCKOUT') {
        console.log(`🔄 Resetting knockout for ${draw.tournament.name} - ${draw.category.name}`);
        
        // Remove knockout data completely
        bracketJson.knockout = null;

        await prisma.draw.update({
          where: { id: draw.id },
          data: {
            bracketJson: JSON.stringify(bracketJson)
          }
        });

        console.log('  ✅ Knockout data removed from bracketJson');
      }
    }

    console.log('\n✅✅✅ KNOCKOUT DATA COMPLETELY REMOVED! ✅✅✅');
    console.log('\n📋 Next steps:');
    console.log('   1. Refresh your browser');
    console.log('   2. Go to the draw page');
    console.log('   3. Click "Continue to Knockout Stage"');
    console.log('   4. Select players and create knockout bracket');
    console.log('\n   This will create a FRESH knockout bracket with no old data!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAndRecreateKnockout();
