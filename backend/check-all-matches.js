import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllMatches() {
  try {
    console.log('🔍 Checking all matches in database...\n');

    const matches = await prisma.match.findMany({
      include: {
        tournament: { select: { name: true } },
        category: { select: { name: true } }
      },
      orderBy: { matchNumber: 'asc' }
    });

    console.log(`Found ${matches.length} total matches\n`);

    const groupedByStage = {};
    matches.forEach(m => {
      const stage = m.stage || 'NO_STAGE';
      if (!groupedByStage[stage]) groupedByStage[stage] = [];
      groupedByStage[stage].push(m);
    });

    Object.keys(groupedByStage).forEach(stage => {
      console.log(`\n📊 ${stage} Matches (${groupedByStage[stage].length}):`);
      groupedByStage[stage].forEach(m => {
        console.log(`  Match #${m.matchNumber} - ${m.tournament.name} - ${m.category.name}`);
        console.log(`    Status: ${m.status}`);
        console.log(`    Round: ${m.round}`);
        console.log(`    Stage: ${m.stage || 'NULL'}`);
      });
    });

    // Check for completed matches
    const completed = matches.filter(m => m.status === 'COMPLETED');
    console.log(`\n✅ Completed: ${completed.length}/${matches.length}`);

    // Check for GROUP stage matches
    const groupMatches = matches.filter(m => m.stage === 'GROUP');
    console.log(`\n🎯 GROUP stage matches: ${groupMatches.length}`);
    console.log(`   Completed: ${groupMatches.filter(m => m.status === 'COMPLETED').length}`);
    console.log(`   Pending: ${groupMatches.filter(m => m.status === 'PENDING').length}`);

    // Check for KNOCKOUT stage matches
    const knockoutMatches = matches.filter(m => m.stage === 'KNOCKOUT');
    console.log(`\n🏆 KNOCKOUT stage matches: ${knockoutMatches.length}`);
    console.log(`   Completed: ${knockoutMatches.filter(m => m.status === 'COMPLETED').length}`);
    console.log(`   Pending: ${knockoutMatches.filter(m => m.status === 'PENDING').length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllMatches();
