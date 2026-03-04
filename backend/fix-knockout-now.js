import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixKnockout() {
  try {
    console.log('🔍 Finding your tournament...');

    // Find the most recent Round Robin + Knockout tournament
    const tournaments = await prisma.tournament.findMany({
      include: {
        categories: {
          include: {
            draws: true,
            matches: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    for (const tournament of tournaments) {
      for (const category of tournament.categories) {
        const draw = category.draws && category.draws[0];
        if (draw) {
          const bracketJson = typeof draw.bracketJson === 'string' 
            ? JSON.parse(draw.bracketJson) 
            : draw.bracketJson;

          if (bracketJson.format === 'ROUND_ROBIN_KNOCKOUT') {
            console.log(`\n✅ Found Round Robin + Knockout tournament:`);
            console.log(`   Tournament: ${tournament.name}`);
            console.log(`   Category: ${category.name}`);
            console.log(`   Total matches in DB: ${category.matches.length}`);
            
            // Check if knockout matches exist
            const knockoutMatches = category.matches.filter(m => m.round > 1 || m.stage === 'KNOCKOUT');
            console.log(`   Knockout matches: ${knockoutMatches.length}`);

            if (knockoutMatches.length > 0) {
              console.log('\n🔄 Resetting knockout matches to PENDING...');
              
              for (const match of knockoutMatches) {
                await prisma.match.update({
                  where: { id: match.id },
                  data: {
                    status: 'PENDING',
                    winnerId: null,
                    score: null,
                    startTime: null,
                    endTime: null
                  }
                });
                console.log(`   ✅ Reset Match ${match.matchNumber}`);
              }
              
              console.log('\n✅ All knockout matches reset!');
            } else {
              console.log('\n⚠️ No knockout matches found in database.');
              console.log('   You need to click "Continue to Knockout Stage" button to create them.');
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixKnockout();
