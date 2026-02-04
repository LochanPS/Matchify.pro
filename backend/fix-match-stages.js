import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMatchStages() {
  try {
    console.log('🔧 Fixing match stages for Round Robin matches...\n');

    // Find the ACE tournament
    const tournament = await prisma.tournament.findFirst({
      where: { name: { contains: 'ace', mode: 'insensitive' } },
      include: {
        categories: {
          include: {
            draws: true,
            matches: true
          }
        }
      }
    });

    if (!tournament) {
      console.log('❌ Tournament not found');
      return;
    }

    console.log(`✅ Found tournament: ${tournament.name}`);

    for (const category of tournament.categories) {
      const draw = category.draws && category.draws[0];
      if (!draw) continue;

      const bracketJson = typeof draw.bracketJson === 'string' 
        ? JSON.parse(draw.bracketJson) 
        : draw.bracketJson;

      if (bracketJson.format !== 'ROUND_ROBIN_KNOCKOUT') continue;

      console.log(`\n📋 Category: ${category.name}`);
      console.log(`   Format: ${bracketJson.format}`);

      // Get all matches for this category
      const matches = category.matches;
      console.log(`   Total matches: ${matches.length}`);
      
      // Show current stages
      matches.forEach(m => {
        console.log(`   Match ${m.matchNumber}: round=${m.round}, stage=${m.stage}`);
      });

      // Update Round Robin matches (round = 1) to have stage = 'GROUP'
      let updatedCount = 0;
      for (const match of matches) {
        if (match.round === 1) {
          await prisma.match.update({
            where: { id: match.id },
            data: { stage: 'GROUP' }
          });
          updatedCount++;
          console.log(`   ✅ Updated Match ${match.matchNumber} from stage='${match.stage}' to stage='GROUP'`);
        }
      }

      console.log(`\n   ✅ Updated ${updatedCount} matches to GROUP stage`);
    }

    console.log('\n✅ All match stages fixed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMatchStages();
