import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function investigateRealData() {
  console.log('🔍 Investigating REAL tournament and match data...\n');

  try {
    // Get Priya Sharma's data
    const priya = await prisma.user.findFirst({
      where: { name: 'Priya Sharma' },
      include: {
        registrations: {
          include: {
            tournament: {
              select: { name: true, status: true }
            },
            category: {
              select: { name: true, status: true }
            }
          }
        }
      }
    });

    console.log('👤 Priya Sharma:');
    console.log(`   Current DB values: ${priya.totalPoints} pts, ${priya.tournamentsPlayed} tournaments, ${priya.matchesWon}W-${priya.matchesLost}L\n`);
    
    console.log('   📋 Registrations:');
    priya.registrations.forEach((reg, i) => {
      console.log(`   ${i + 1}. ${reg.tournament.name} - ${reg.category.name}`);
      console.log(`      Status: ${reg.status}`);
      console.log(`      Tournament Status: ${reg.tournament.status}`);
      console.log(`      Category Status: ${reg.category.status}`);
    });

    // Get ALL matches for Priya
    const allMatches = await prisma.match.findMany({
      where: {
        OR: [
          { player1Id: priya.id },
          { player2Id: priya.id }
        ]
      },
      include: {
        tournament: {
          select: { name: true }
        },
        category: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`\n   🎯 Total Matches Found: ${allMatches.length}`);
    console.log('   Match Details:');
    
    let wins = 0;
    let losses = 0;
    
    allMatches.forEach((match, i) => {
      const isPlayer1 = match.player1Id === priya.id;
      const isWinner = match.winnerId === priya.id;
      const result = match.status === 'COMPLETED' 
        ? (isWinner ? 'WON' : match.winnerId ? 'LOST' : 'NO WINNER')
        : match.status;
      
      if (match.status === 'COMPLETED' && isWinner) wins++;
      if (match.status === 'COMPLETED' && match.winnerId && !isWinner) losses++;
      
      console.log(`   ${i + 1}. ${match.tournament.name} - ${match.category.name}`);
      console.log(`      Position: ${isPlayer1 ? 'Player 1' : 'Player 2'}`);
      console.log(`      Status: ${match.status}`);
      console.log(`      Result: ${result}`);
      console.log(`      Round: ${match.round}, Stage: ${match.stage || 'N/A'}`);
    });

    console.log(`\n   ✅ REAL Stats: ${wins}W-${losses}L\n`);

    // Now check ALL users
    console.log('\n📊 Checking ALL users...\n');
    
    const allUsers = await prisma.user.findMany({
      orderBy: { totalPoints: 'desc' },
      take: 10
    });

    for (const user of allUsers) {
      // Count confirmed registrations
      const confirmedRegs = await prisma.registration.count({
        where: {
          userId: user.id,
          status: 'confirmed'
        }
      });

      // Count matches
      const userMatches = await prisma.match.findMany({
        where: {
          OR: [
            { player1Id: user.id },
            { player2Id: user.id }
          ],
          status: 'COMPLETED'
        }
      });

      let realWins = 0;
      let realLosses = 0;

      userMatches.forEach(match => {
        if (match.winnerId === user.id) {
          realWins++;
        } else if (match.winnerId) {
          realLosses++;
        }
      });

      const dbWinRate = user.matchesWon + user.matchesLost > 0 
        ? ((user.matchesWon / (user.matchesWon + user.matchesLost)) * 100).toFixed(1)
        : 0;
      
      const realWinRate = realWins + realLosses > 0 
        ? ((realWins / (realWins + realLosses)) * 100).toFixed(1)
        : 0;

      const hasError = 
        user.tournamentsPlayed !== confirmedRegs ||
        user.matchesWon !== realWins ||
        user.matchesLost !== realLosses;

      if (hasError) {
        console.log(`❌ ${user.name}:`);
        console.log(`   DB:   ${user.totalPoints} pts | ${user.tournamentsPlayed} tournaments | ${user.matchesWon}W-${user.matchesLost}L (${dbWinRate}%)`);
        console.log(`   REAL: ${user.totalPoints} pts | ${confirmedRegs} tournaments | ${realWins}W-${realLosses}L (${realWinRate}%)`);
        console.log('');
      } else {
        console.log(`✅ ${user.name}: All correct`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

investigateRealData()
  .then(() => {
    console.log('\n✅ Investigation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Investigation failed:', error);
    process.exit(1);
  });
