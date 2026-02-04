import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testManualAssignment() {
  try {
    console.log('🧪 TESTING MANUAL ASSIGNMENT...\n');

    // Get tournament
    const tournament = await prisma.tournament.findFirst({
      where: { name: 'ace badminton' }
    });

    if (!tournament) {
      console.log('❌ Tournament not found');
      return;
    }

    // Get category
    const category = await prisma.category.findFirst({
      where: { 
        tournamentId: tournament.id,
        name: 'mens'
      }
    });

    if (!category) {
      console.log('❌ Category not found');
      return;
    }

    console.log(`✅ Tournament: ${tournament.name}`);
    console.log(`✅ Category: ${category.name}\n`);

    // Get draw
    const draw = await prisma.draw.findUnique({
      where: {
        tournamentId_categoryId: {
          tournamentId: tournament.id,
          categoryId: category.id
        }
      }
    });

    if (!draw) {
      console.log('❌ Draw not found');
      return;
    }

    let bracketJson = typeof draw.bracketJson === 'string' 
      ? JSON.parse(draw.bracketJson) 
      : draw.bracketJson;

    console.log(`📊 Bracket Format: ${bracketJson.format}`);
    console.log(`📊 Bracket Size: ${bracketJson.bracketSize}`);
    console.log(`📊 Rounds: ${bracketJson.rounds?.length || 0}\n`);

    // Get confirmed registrations
    const registrations = await prisma.registration.findMany({
      where: {
        tournamentId: tournament.id,
        categoryId: category.id,
        status: 'confirmed'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`👥 Confirmed registrations: ${registrations.length}\n`);

    // Create assignments for first 4 players manually
    const assignments = [];
    for (let i = 0; i < Math.min(4, registrations.length); i++) {
      assignments.push({
        slot: i + 1,
        playerId: registrations[i].user.id,
        playerName: registrations[i].user.name
      });
    }

    console.log('📝 Test assignments:');
    assignments.forEach(a => {
      console.log(`   Slot ${a.slot}: ${a.playerName}`);
    });
    console.log('');

    // Now simulate what assignPlayersToDraw does
    console.log('🔨 Simulating assignPlayersToDraw logic...\n');

    // Build player slot map
    const playerSlotMap = {};
    assignments.forEach(({ slot, playerId, playerName }) => {
      playerSlotMap[playerId] = { slot, playerName };
    });

    // Apply to bracket
    if (bracketJson.format === 'KNOCKOUT' && bracketJson.rounds) {
      const firstRound = bracketJson.rounds[0];
      
      // Clear all slots
      firstRound.matches.forEach((match, idx) => {
        match.player1 = { id: null, name: `Slot ${idx * 2 + 1}`, seed: idx * 2 + 1 };
        match.player2 = { id: null, name: `Slot ${idx * 2 + 2}`, seed: idx * 2 + 2 };
      });
      
      // Assign players
      Object.entries(playerSlotMap).forEach(([playerId, { slot, playerName }]) => {
        const matchIndex = Math.floor((slot - 1) / 2);
        const playerPosition = (slot - 1) % 2 === 0 ? 'player1' : 'player2';
        if (firstRound.matches[matchIndex]) {
          firstRound.matches[matchIndex][playerPosition] = {
            id: playerId,
            name: playerName,
            seed: slot
          };
        }
      });
      
      console.log('✅ Updated bracket JSON');
      console.log('   First round matches:');
      firstRound.matches.slice(0, 2).forEach((match, idx) => {
        console.log(`   Match ${idx + 1}: ${match.player1?.name || 'Empty'} vs ${match.player2?.name || 'Empty'}`);
      });
      console.log('');

      // Delete existing matches
      const deletedCount = await prisma.match.deleteMany({
        where: { tournamentId: tournament.id, categoryId: category.id }
      });
      console.log(`🧹 Deleted ${deletedCount.count} existing matches\n`);

      // Create match records
      console.log('🔨 Creating match records...');
      const matchRecords = [];
      const totalRounds = bracketJson.rounds.length;
      
      for (let roundIdx = 0; roundIdx < bracketJson.rounds.length; roundIdx++) {
        const round = bracketJson.rounds[roundIdx];
        const reverseRoundNumber = totalRounds - roundIdx;
        
        for (let matchIdx = 0; matchIdx < round.matches.length; matchIdx++) {
          const match = round.matches[matchIdx];
          matchRecords.push({
            tournamentId: tournament.id,
            categoryId: category.id,
            round: reverseRoundNumber,
            matchNumber: matchIdx + 1,
            stage: 'KNOCKOUT',
            player1Id: match.player1?.id || null,
            player2Id: match.player2?.id || null,
            player1Seed: match.player1?.seed || null,
            player2Seed: match.player2?.seed || null,
            status: 'PENDING'
          });
        }
      }

      console.log(`   Total match records to create: ${matchRecords.length}`);
      console.log(`   Sample records:`);
      matchRecords.slice(0, 3).forEach(m => {
        console.log(`     Round ${m.round}, Match ${m.matchNumber}: ${m.player1Id ? 'Player' : 'NULL'} vs ${m.player2Id ? 'Player' : 'NULL'}`);
      });
      console.log('');

      if (matchRecords.length > 0) {
        const result = await prisma.match.createMany({ data: matchRecords });
        console.log(`✅ Created ${result.count} match records!\n`);
      }

      // Verify matches were created
      const createdMatches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, categoryId: category.id },
        orderBy: { matchNumber: 'asc' }
      });

      console.log(`📊 Verification: ${createdMatches.length} matches now in database`);
      console.log(`   First 3 matches:`);
      createdMatches.slice(0, 3).forEach(m => {
        console.log(`     Round ${m.round}, Match ${m.matchNumber}: player1Id=${m.player1Id ? 'SET' : 'NULL'}, player2Id=${m.player2Id ? 'SET' : 'NULL'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testManualAssignment();
