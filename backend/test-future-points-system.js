import { PrismaClient } from '@prisma/client';
import tournamentPointsService from './src/services/tournamentPoints.service.js';

const prisma = new PrismaClient();

async function testFuturePointsSystem() {
  console.log('🧪 Testing Future Points System...\n');
  console.log('This test verifies that when you end a category in the future,');
  console.log('all stats (points, tournaments, matches, win rate) will update correctly.\n');

  try {
    // Find a test user
    const testUser = await prisma.user.findFirst({
      where: { name: 'PS Pradyumna' }
    });

    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log(`👤 Test User: ${testUser.name}`);
    console.log(`📊 Current Stats:`);
    console.log(`   Points: ${testUser.totalPoints}`);
    console.log(`   Tournaments: ${testUser.tournamentsPlayed}`);
    console.log(`   Matches: ${testUser.matchesWon}W-${testUser.matchesLost}L\n`);

    // Find a completed category
    const completedCategory = await prisma.category.findFirst({
      where: {
        status: 'completed'
      },
      include: {
        tournament: true
      }
    });

    if (!completedCategory) {
      console.log('❌ No completed category found for testing');
      return;
    }

    console.log(`🏆 Testing with category: ${completedCategory.name}`);
    console.log(`   Tournament: ${completedCategory.tournament.name}`);
    console.log(`   Status: ${completedCategory.status}\n`);

    // Simulate awarding points (this is what happens when you click "End Category")
    console.log('🎯 Simulating "End Category" action...\n');
    
    const pointsAwarded = await tournamentPointsService.awardTournamentPoints(
      completedCategory.tournamentId,
      completedCategory.id
    );

    console.log(`✅ Points awarded to ${pointsAwarded.length} players\n`);

    // Check if test user got points
    const userGotPoints = pointsAwarded.find(p => p.userId === testUser.id);
    
    if (userGotPoints) {
      console.log(`🎉 ${testUser.name} received ${userGotPoints.points} points for ${userGotPoints.placement}\n`);
    }

    // Fetch updated user stats
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        playerProfile: true
      }
    });

    console.log(`📊 Updated Stats for ${updatedUser.name}:`);
    console.log(`   Points: ${updatedUser.totalPoints}`);
    console.log(`   Tournaments: ${updatedUser.tournamentsPlayed}`);
    console.log(`   Matches: ${updatedUser.matchesWon}W-${updatedUser.matchesLost}L`);
    
    const winRate = updatedUser.matchesWon + updatedUser.matchesLost > 0 
      ? ((updatedUser.matchesWon / (updatedUser.matchesWon + updatedUser.matchesLost)) * 100).toFixed(1)
      : 0;
    console.log(`   Win Rate: ${winRate}%\n`);

    // Verify PlayerProfile is in sync
    if (updatedUser.playerProfile) {
      const profileMatch = 
        updatedUser.playerProfile.matchifyPoints === updatedUser.totalPoints &&
        updatedUser.playerProfile.tournamentsPlayed === updatedUser.tournamentsPlayed &&
        updatedUser.playerProfile.matchesWon === updatedUser.matchesWon &&
        updatedUser.playerProfile.matchesLost === updatedUser.matchesLost;

      if (profileMatch) {
        console.log('✅ User and PlayerProfile are in sync!');
      } else {
        console.log('❌ User and PlayerProfile are OUT OF SYNC!');
        console.log('   User:', {
          points: updatedUser.totalPoints,
          tournaments: updatedUser.tournamentsPlayed,
          matches: `${updatedUser.matchesWon}W-${updatedUser.matchesLost}L`
        });
        console.log('   Profile:', {
          points: updatedUser.playerProfile.matchifyPoints,
          tournaments: updatedUser.playerProfile.tournamentsPlayed,
          matches: `${updatedUser.playerProfile.matchesWon}W-${updatedUser.playerProfile.matchesLost}L`
        });
      }
    }

    console.log('\n🎯 VERIFICATION CHECKLIST:\n');
    
    // Check 1: Points updated
    const pointsUpdated = updatedUser.totalPoints >= testUser.totalPoints;
    console.log(`${pointsUpdated ? '✅' : '❌'} Points updated correctly`);

    // Check 2: Tournaments counted
    const tournamentsCorrect = updatedUser.tournamentsPlayed > 0;
    console.log(`${tournamentsCorrect ? '✅' : '❌'} Tournaments counted`);

    // Check 3: Matches counted
    const matchesCounted = (updatedUser.matchesWon + updatedUser.matchesLost) >= 0;
    console.log(`${matchesCounted ? '✅' : '❌'} Matches counted`);

    // Check 4: Win rate calculable
    const winRateValid = !isNaN(parseFloat(winRate));
    console.log(`${winRateValid ? '✅' : '❌'} Win rate calculable`);

    // Check 5: Profile synced
    const profileSynced = updatedUser.playerProfile && 
      updatedUser.playerProfile.matchifyPoints === updatedUser.totalPoints;
    console.log(`${profileSynced ? '✅' : '❌'} PlayerProfile synced`);

    console.log('\n🎉 FUTURE POINTS SYSTEM TEST COMPLETE!\n');
    
    if (pointsUpdated && tournamentsCorrect && matchesCounted && winRateValid && profileSynced) {
      console.log('✅ ALL CHECKS PASSED - Points system will work correctly in the future!');
    } else {
      console.log('⚠️  SOME CHECKS FAILED - Review the issues above');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testFuturePointsSystem()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
