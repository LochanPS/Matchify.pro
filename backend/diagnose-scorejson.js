import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function diagnoseScoreJson() {
  try {
    console.log('🔍 Diagnosing scoreJson Issue...\n');
    console.log('=' .repeat(80));
    
    // 1. Find completed round-robin matches
    console.log('\n📊 STEP 1: Finding completed GROUP stage matches...\n');
    
    const completedMatches = await prisma.match.findMany({
      where: {
        status: 'COMPLETED',
        stage: 'GROUP'
      },
      take: 5,
      orderBy: {
        completedAt: 'desc'
      },
      select: {
        id: true,
        matchNumber: true,
        player1Id: true,
        player2Id: true,
        winnerId: true,
        scoreJson: true,
        status: true,
        stage: true,
        completedAt: true,
        tournamentId: true,
        categoryId: true
      }
    });
    
    console.log(`Found ${completedMatches.length} completed GROUP stage matches\n`);
    
    if (completedMatches.length === 0) {
      console.log('❌ NO COMPLETED GROUP STAGE MATCHES FOUND');
      console.log('\nPossible reasons:');
      console.log('1. No round-robin matches have been completed yet');
      console.log('2. Matches are not marked with stage="GROUP"');
      console.log('3. Database connection issue');
      
      // Check if there are ANY completed matches
      const anyCompleted = await prisma.match.findMany({
        where: { status: 'COMPLETED' },
        take: 5,
        select: {
          id: true,
          matchNumber: true,
          stage: true,
          status: true,
          scoreJson: true
        }
      });
      
      console.log(`\nFound ${anyCompleted.length} completed matches (any stage):`);
      anyCompleted.forEach(m => {
        console.log(`  - Match ${m.matchNumber}: stage=${m.stage || 'NULL'}, scoreJson=${m.scoreJson ? 'EXISTS' : 'NULL'}`);
      });
      
      return;
    }
    
    // 2. Analyze each completed match
    console.log('=' .repeat(80));
    console.log('\n📋 STEP 2: Analyzing scoreJson for each match...\n');
    
    let matchesWithScore = 0;
    let matchesWithoutScore = 0;
    let matchesWithInvalidScore = 0;
    
    for (const match of completedMatches) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📊 Match ${match.matchNumber} (ID: ${match.id.substring(0, 8)}...)`);
      console.log(`   Completed: ${match.completedAt?.toISOString() || 'Unknown'}`);
      console.log(`   Player 1: ${match.player1Id}`);
      console.log(`   Player 2: ${match.player2Id}`);
      console.log(`   Winner: ${match.winnerId}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Stage: ${match.stage}`);
      
      if (!match.scoreJson) {
        console.log(`   ❌ scoreJson: NULL - NO SCORE DATA SAVED!`);
        matchesWithoutScore++;
        continue;
      }
      
      console.log(`   ✅ scoreJson exists (${match.scoreJson.length} chars)`);
      
      try {
        const scoreData = JSON.parse(match.scoreJson);
        console.log(`   📄 Parsed scoreJson structure:`);
        console.log(`      - Has 'sets' field: ${!!scoreData.sets}`);
        console.log(`      - Sets is array: ${Array.isArray(scoreData.sets)}`);
        console.log(`      - Number of sets: ${scoreData.sets?.length || 0}`);
        
        if (scoreData.sets && Array.isArray(scoreData.sets) && scoreData.sets.length > 0) {
          console.log(`   📈 Set scores:`);
          let p1Total = 0;
          let p2Total = 0;
          
          scoreData.sets.forEach((set, idx) => {
            // Try all possible field names
            const p1 = set.player1 ?? set.p1 ?? set.score1 ?? null;
            const p2 = set.player2 ?? set.p2 ?? set.score2 ?? null;
            
            console.log(`      Set ${idx + 1}:`, JSON.stringify(set));
            console.log(`         Detected: p1=${p1}, p2=${p2}`);
            
            if (p1 !== null && p2 !== null) {
              p1Total += p1;
              p2Total += p2;
            } else {
              console.log(`         ⚠️ Could not extract scores from this set!`);
            }
          });
          
          console.log(`   🎯 Total Points: Player1=${p1Total}, Player2=${p2Total}`);
          
          if (p1Total === 0 && p2Total === 0) {
            console.log(`   ❌ PROBLEM: Total points are 0 - score fields not recognized!`);
            matchesWithInvalidScore++;
          } else {
            console.log(`   ✅ Score data is valid and can be calculated`);
            matchesWithScore++;
          }
        } else {
          console.log(`   ❌ PROBLEM: scoreJson has no sets array or it's empty!`);
          console.log(`   Full scoreJson:`, JSON.stringify(scoreData, null, 2));
          matchesWithInvalidScore++;
        }
      } catch (parseError) {
        console.log(`   ❌ PROBLEM: Failed to parse scoreJson!`);
        console.log(`   Error: ${parseError.message}`);
        console.log(`   Raw scoreJson: ${match.scoreJson.substring(0, 200)}...`);
        matchesWithInvalidScore++;
      }
    }
    
    // 3. Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 SUMMARY\n');
    console.log(`Total completed GROUP matches analyzed: ${completedMatches.length}`);
    console.log(`  ✅ Matches with valid scoreJson: ${matchesWithScore}`);
    console.log(`  ⚠️  Matches with invalid scoreJson: ${matchesWithInvalidScore}`);
    console.log(`  ❌ Matches with NULL scoreJson: ${matchesWithoutScore}`);
    
    // 4. Check a draw to see current TP values
    if (completedMatches.length > 0) {
      const firstMatch = completedMatches[0];
      console.log('\n' + '='.repeat(80));
      console.log(`\n📋 STEP 3: Checking Draw bracketJson for TP values...\n`);
      console.log(`Tournament: ${firstMatch.tournamentId}`);
      console.log(`Category: ${firstMatch.categoryId}`);
      
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
        console.log(`Format: ${bracketData.format}`);
        
        if (bracketData.groups && bracketData.groups.length > 0) {
          console.log(`\nGroups found: ${bracketData.groups.length}`);
          
          bracketData.groups.forEach((group, idx) => {
            console.log(`\n${group.groupName || `Group ${idx + 1}`}:`);
            if (group.participants && group.participants.length > 0) {
              group.participants.forEach(p => {
                const tp = p.totalPoints ?? 0;
                console.log(`  ${p.name}: ${p.points}pts (${p.wins}W-${p.losses}L, ${p.played}P, TP:${tp})`);
              });
              
              const allZero = group.participants.every(p => (p.totalPoints ?? 0) === 0);
              if (allZero && group.participants.some(p => p.played > 0)) {
                console.log(`\n  ❌ PROBLEM: All TP values are 0 even though matches have been played!`);
              }
            }
          });
        }
      } else {
        console.log('❌ Draw not found');
      }
    }
    
    // 5. Diagnosis
    console.log('\n' + '='.repeat(80));
    console.log('\n🔬 DIAGNOSIS\n');
    
    if (matchesWithoutScore > 0) {
      console.log('❌ CRITICAL ISSUE: Matches are being completed WITHOUT scoreJson!');
      console.log('   This means the match completion endpoint is not saving scores.');
      console.log('   Solution: Check the frontend is sending finalScore/scoreData in the request.');
    }
    
    if (matchesWithInvalidScore > 0) {
      console.log('⚠️  WARNING: Some matches have scoreJson but it\'s in an invalid format!');
      console.log('   This means scores are being saved but not in the expected structure.');
      console.log('   Solution: Check the scoreJson format being sent from the frontend.');
    }
    
    if (matchesWithScore > 0 && matchesWithoutScore === 0 && matchesWithInvalidScore === 0) {
      console.log('✅ All matches have valid scoreJson!');
      console.log('   If TP is still 0, the issue is in the getDraw() calculation logic.');
      console.log('   Check that getDraw() is being called and the TP calculation is running.');
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseScoreJson();
