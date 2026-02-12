import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMatches() {
  try {
    console.log('🔍 Checking all matches...');

    // Get all matches
    const allMatches = await prisma.match.findMany({
      orderBy: { matchNumber: 'asc' }
    });

    console.log(`\nTotal matches: ${allMatches.length}\n`);

    // Group by stage
    const byStage = {};
    allMatches.forEach(m => {
      const stage = m.stage || 'NULL';
      if (!byStage[stage]) byStage[stage] = [];
      byStage[stage].push(m);
    });

    console.log('Matches by stage:');
    Object.keys(byStage).forEach(stage => {
      console.log(`  ${stage}: ${byStage[stage].length} matches`);
    });

    // Show matches with status COMPLETED
    const completedMatches = allMatches.filter(m => m.status === 'COMPLETED');
    console.log(`\n⚠️ COMPLETED matches: ${completedMatches.length}`);
    
    completedMatches.forEach(m => {
      console.log(`  Match ${m.matchNumber}: stage=${m.stage}, round=${m.round}, status=${m.status}`);
    });

    // Show matches that are NOT in GROUP stage
    const nonGroupMatches = allMatches.filter(m => m.stage !== 'GROUP');
    console.log(`\n🎯 Non-GROUP matches: ${nonGroupMatches.length}`);
    
    nonGroupMatches.forEach(m => {
      console.log(`  Match ${m.matchNumber}: stage=${m.stage}, round=${m.round}, status=${m.status}, id=${m.id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMatches();
