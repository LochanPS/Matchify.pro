import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTPIssue() {
  try {
    console.log('🔍 Checking TP (Total Points) Issue...\n');
    
    // 1. Find a completed round-robin match
    const completedMatches = await prisma.match.findMany({
      where: {
        status: 'COMPLETED',
        stage: 'GROUP'
      },
      take: 3,
      select: {
        id: true,
        matchNumber: true,
        player1Id: true,
        player2Id: true,
        winnerId: true,
        scoreJson: true,
        status: true,
        stage: true,
        tournamentId: true,
        categoryId: true
      }
    });
    
    console.log(`Found ${completedMatches.length} completed GROUP stage matches\n`);
    
    if (completedMatches.length === 0) {
      console.log('❌ No completed GROUP stage matches found');
      console.log('   This means either:');
      console.log('   1. No round-robin matches have been completed yet');
      console.log('   2. Matches are not marked with stage="GROUP"');
      return;
    }
    
    // Check each match
    for (const match of completedMatches) {
      console.log(`\n📊 Match ${match.matchNumber}:`);
      console.log(`   Player 1: ${match.player1Id}`);
      console.log(`   Player 2: ${match.player2Id}`);
      console.log(`   Winner: ${match.winnerId}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Stage: ${match.stage}`);
      
      if (match.scoreJson) {
        try {
          const scoreData = JSON.parse(match.scoreJson);
          console.log(`   ✅ scoreJson exists:`, JSON.stringify(scoreData, null, 2));
          
          // Check if sets data exists
          if (scoreData.sets && Array.isArray(scoreData.sets)) {
            let p1Total = 0;
            let p2Total = 0;
            scoreData.sets.forEach((set, idx) => {
              p1Total += (set.player1 || 0);
              p2Total += (set.player2 || 0);
              console.log(`      Set ${idx + 1}: Player1=${set.player1 || 0}, Player2=${set.player2 || 0}`);
            });
            console.log(`   📈 Total Points: Player1=${p1Total}, Player2=${p2Total}`);
          } else {
            console.log(`   ⚠️ scoreJson exists but has no sets array`);
          }
        } catch (e) {
          console.log(`   ❌ scoreJson exists but failed to parse:`, e.message);
        }
      } else {
        console.log(`   ❌ scoreJson is NULL - scores were not saved!`);
      }
    }
    
    // 2. Check the draw bracketJson for one of these matches
    if (completedMatches.length > 0) {
      const firstMatch = completedMatches[0];
      console.log(`\n\n🔍 Checking Draw bracketJson for tournament ${firstMatch.tournamentId}, category ${firstMatch.categoryId}...\n`);
      
      const draw = await prisma.draw.findUnique({
        where: {
          tournamentId_categoryId: {
            tournamentId: firstMatch.tournamentId,
            categoryId: firstMatch.categoryId
          }
        }
      });
      
      if (draw) {
        const bracketData = JSON.parse(draw.bracketJson);
        console.log(`   Format: ${bracketData.format}`);
        
        if (bracketData.groups && bracketData.groups.length > 0) {
          const group = bracketData.groups[0];
          console.log(`\n   ${group.groupName} Participants:`);
          group.participants.forEach(p => {
            console.log(`      ${p.name}: ${p.points}pts (${p.wins}W-${p.losses}L, ${p.played}P, TP:${p.totalPoints || 0})`);
          });
          
          // Check if totalPoints field exists
          const hasTotalPoints = group.participants.some(p => p.totalPoints !== undefined);
          if (!hasTotalPoints) {
            console.log(`\n   ❌ PROBLEM: totalPoints field is missing from participants!`);
          } else {
            const allZero = group.participants.every(p => (p.totalPoints || 0) === 0);
            if (allZero) {
              console.log(`\n   ❌ PROBLEM: All totalPoints are 0 even though matches are completed!`);
            }
          }
        }
      } else {
        console.log(`   ❌ Draw not found`);
      }
    }
    
    console.log('\n\n📋 DIAGNOSIS:');
    console.log('─────────────────────────────────────────────────────────');
    console.log('The TP (Total Points) issue occurs because:');
    console.log('');
    console.log('1. When a match is completed via match.routes.js /end endpoint,');
    console.log('   the scoreJson IS saved to the Match table.');
    console.log('');
    console.log('2. The /end endpoint updates the bracketJson standings,');
    console.log('   but it only updates wins/losses/ranking points.');
    console.log('   It does NOT calculate or update totalPoints (TP).');
    console.log('');
    console.log('3. When getDraw() is called, it recalculates standings');
    console.log('   from completed matches, including totalPoints.');
    console.log('   BUT the recalculation logic was recently added.');
    console.log('');
    console.log('4. The frontend displays TP from bracketJson.groups[].participants[].totalPoints');
    console.log('');
    console.log('SOLUTION:');
    console.log('The getDraw() function already has the fix to calculate TP.');
    console.log('The issue is that the TP calculation might not be working correctly.');
    console.log('We need to verify the TP calculation logic is parsing scoreJson properly.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTPIssue();
