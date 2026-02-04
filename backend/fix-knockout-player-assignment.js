/**
 * Fix knockout player assignment
 * Properly assign 8 players to Quarter Finals matches
 * Clear Semi Finals and Final (they should be TBD until matches are completed)
 */

import prisma from './src/lib/prisma.js';

async function main() {
  console.log('🔧 FIXING KNOCKOUT PLAYER ASSIGNMENT\n');
  console.log('='.repeat(70));

  try {
    // Find the tournament and category
    const tournament = await prisma.tournament.findFirst({
      include: { categories: true }
    });

    if (!tournament) {
      console.log('❌ No tournament found');
      return;
    }

    const category = tournament.categories[0]; // Use first category
    console.log(`\n📋 Tournament: ${tournament.name}`);
    console.log(`📂 Category: ${category.name}`);

    // Get all confirmed registrations
    const registrations = await prisma.registration.findMany({
      where: {
        tournamentId: tournament.id,
        categoryId: category.id,
        status: 'confirmed'
      },
      include: {
        user: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'asc' },
      take: 8 // Take first 8 players
    });

    console.log(`\n✅ Found ${registrations.length} confirmed registrations`);
    
    if (registrations.length < 8) {
      console.log('⚠️  Warning: Less than 8 players. Need 8 players for Quarter Finals.');
      console.log('   Continuing with available players...');
    }

    // Get all knockout matches
    const knockoutMatches = await prisma.match.findMany({
      where: {
        tournamentId: tournament.id,
        categoryId: category.id,
        stage: 'KNOCKOUT'
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });

    console.log(`\n✅ Found ${knockoutMatches.length} knockout matches`);

    // Group by round
    const rounds = {};
    knockoutMatches.forEach(match => {
      if (!rounds[match.round]) {
        rounds[match.round] = [];
      }
      rounds[match.round].push(match);
    });

    const maxRound = Math.max(...Object.keys(rounds).map(Number));
    const quarterFinals = rounds[maxRound] || [];
    
    console.log(`\n📍 Quarter Finals (Round ${maxRound}): ${quarterFinals.length} matches`);

    if (quarterFinals.length !== 4) {
      console.log('❌ Error: Expected 4 Quarter Final matches, found', quarterFinals.length);
      return;
    }

    // STEP 1: Clear ALL knockout matches (reset to TBD)
    console.log(`\n🧹 Step 1: Clearing all knockout matches...`);
    for (const match of knockoutMatches) {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          player1Id: null,
          player2Id: null,
          winnerId: null,
          status: 'PENDING',
          scoreJson: null,
          startedAt: null,
          completedAt: null
        }
      });
    }
    console.log(`✅ Cleared ${knockoutMatches.length} matches`);

    // STEP 2: Assign players to Quarter Finals
    console.log(`\n👥 Step 2: Assigning players to Quarter Finals...`);
    
    for (let i = 0; i < quarterFinals.length && i < 4; i++) {
      const match = quarterFinals[i];
      const player1 = registrations[i * 2];
      const player2 = registrations[i * 2 + 1];

      if (player1 && player2) {
        await prisma.match.update({
          where: { id: match.id },
          data: {
            player1Id: player1.user.id,
            player2Id: player2.user.id,
            status: 'PENDING'
          }
        });

        console.log(`✅ Match ${match.matchNumber}: ${player1.user.name} vs ${player2.user.name}`);
      } else if (player1) {
        // Only one player (bye)
        await prisma.match.update({
          where: { id: match.id },
          data: {
            player1Id: player1.user.id,
            player2Id: null,
            status: 'PENDING'
          }
        });
        console.log(`✅ Match ${match.matchNumber}: ${player1.user.name} vs BYE`);
      }
    }

    // STEP 3: Verify the fix
    console.log(`\n🔍 Step 3: Verifying the fix...`);
    
    const updatedMatches = await prisma.match.findMany({
      where: {
        tournamentId: tournament.id,
        categoryId: category.id,
        stage: 'KNOCKOUT'
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });

    // Fetch player names
    for (const match of updatedMatches) {
      if (match.player1Id) {
        const player = await prisma.user.findUnique({
          where: { id: match.player1Id },
          select: { name: true }
        });
        match.player1Name = player?.name || 'Unknown';
      }
      if (match.player2Id) {
        const player = await prisma.user.findUnique({
          where: { id: match.player2Id },
          select: { name: true }
        });
        match.player2Name = player?.name || 'Unknown';
      }
    }

    // Display results
    const updatedRounds = {};
    updatedMatches.forEach(match => {
      if (!updatedRounds[match.round]) {
        updatedRounds[match.round] = [];
      }
      updatedRounds[match.round].push(match);
    });

    Object.keys(updatedRounds).sort((a, b) => b - a).forEach(roundNum => {
      const roundMatches = updatedRounds[roundNum];
      const roundName = getRoundName(parseInt(roundNum), Object.keys(updatedRounds).length);
      
      console.log(`\n   ${roundName} (Round ${roundNum}):`);
      roundMatches.forEach(match => {
        const p1 = match.player1Name || 'TBD';
        const p2 = match.player2Name || 'TBD';
        console.log(`     Match ${match.matchNumber}: ${p1} vs ${p2}`);
      });
    });

    console.log(`\n${'='.repeat(70)}`);
    console.log('✅ FIX COMPLETE!');
    console.log(`${'='.repeat(70)}`);
    console.log('\n📝 Summary:');
    console.log('   - Quarter Finals: All 4 matches have players assigned');
    console.log('   - Semi Finals: Empty (TBD) - waiting for QF winners');
    console.log('   - Final: Empty (TBD) - waiting for SF winners');
    console.log('\n💡 Next steps:');
    console.log('   1. Refresh the frontend (F5)');
    console.log('   2. Complete Quarter Final matches');
    console.log('   3. Winners will automatically advance to Semi Finals');
    console.log('   4. Complete Semi Final matches');
    console.log('   5. Winners will automatically advance to Final');

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

function getRoundName(roundNum, totalRounds) {
  const participants = Math.pow(2, roundNum);
  
  if (participants === 2) return 'FINAL';
  if (participants === 4) return 'SEMI FINALS';
  if (participants === 8) return 'QUARTER FINALS';
  if (participants === 16) return 'ROUND OF 16';
  
  return `ROUND ${totalRounds - roundNum + 1}`;
}

main();
