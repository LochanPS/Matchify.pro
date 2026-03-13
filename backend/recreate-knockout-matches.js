import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function recreateKnockoutMatches() {
  try {
    console.log('🔧 Recreating Knockout Matches from Bracket JSON...\n');

    const draw = await prisma.draw.findFirst({
      where: {
        format: 'ROUND_ROBIN_KNOCKOUT'
      },
      include: {
        tournament: true,
        category: true
      }
    });

    if (!draw) {
      console.log('❌ No Round Robin + Knockout draw found');
      return;
    }

    console.log(`🎯 Tournament: ${draw.tournament.name} - ${draw.category.name}\n`);

    const bracketJson = typeof draw.bracketJson === 'string' 
      ? JSON.parse(draw.bracketJson) 
      : draw.bracketJson;

    // STEP 1: Delete all existing knockout matches
    console.log('🗑️  Deleting existing knockout matches...');
    const deleted = await prisma.match.deleteMany({
      where: {
        tournamentId: draw.tournamentId,
        categoryId: draw.categoryId,
        stage: 'KNOCKOUT'
      }
    });
    console.log(`   ✓ Deleted ${deleted.count} matches\n`);

    // STEP 2: Create matches from bracket JSON
    if (!bracketJson.knockout || !bracketJson.knockout.rounds) {
      console.log('❌ No knockout structure in bracket JSON');
      return;
    }

    console.log('🔨 Creating knockout matches from bracket JSON...\n');

    const totalRounds = bracketJson.knockout.rounds.length;
    
    // Process rounds in order (first round in array = semi-finals)
    for (let roundIdx = 0; roundIdx < bracketJson.knockout.rounds.length; roundIdx++) {
      const round = bracketJson.knockout.rounds[roundIdx];
      
      // Calculate database round number (reverse: last round = 1 = finals)
      const dbRoundNumber = totalRounds - roundIdx;
      
      const roundName = dbRoundNumber === 1 ? 'Finals' : 
                       dbRoundNumber === 2 ? 'Semi-Finals' :
                       dbRoundNumber === 3 ? 'Quarter-Finals' : 
                       `Round ${dbRoundNumber}`;
      
      console.log(`📋 ${roundName} (DB Round ${dbRoundNumber}):`);
      console.log(`   Creating ${round.matches.length} matches...\n`);
      
      // Create each match in this round
      for (let matchIdx = 0; matchIdx < round.matches.length; matchIdx++) {
        const bracketMatch = round.matches[matchIdx];
        const matchNumber = matchIdx + 1; // Each round starts from 1
        
        const matchData = {
          tournamentId: draw.tournamentId,
          categoryId: draw.categoryId,
          round: dbRoundNumber,
          matchNumber: matchNumber,
          stage: 'KNOCKOUT',
          status: 'PENDING',
          player1Id: bracketMatch.player1?.id || null,
          player2Id: bracketMatch.player2?.id || null,
          winnerId: null,
          scoreJson: null,
          startedAt: null,
          completedAt: null,
          umpireId: null
        };

        const createdMatch = await prisma.match.create({
          data: matchData
        });

        const p1Name = bracketMatch.player1?.name || 'TBA';
        const p2Name = bracketMatch.player2?.name || 'TBA';
        
        console.log(`   ✓ Match ${matchNumber}: ${p1Name} vs ${p2Name}`);
        console.log(`      ID: ${createdMatch.id}`);
        console.log(`      Status: ${createdMatch.status}\n`);
      }
    }

    console.log('\n🎉 Knockout matches recreated successfully!');
    console.log('\n📊 Summary:');
    
    const finalMatches = await prisma.match.findMany({
      where: {
        tournamentId: draw.tournamentId,
        categoryId: draw.categoryId,
        stage: 'KNOCKOUT'
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });

    const byRound = {};
    finalMatches.forEach(m => {
      if (!byRound[m.round]) byRound[m.round] = [];
      byRound[m.round].push(m);
    });

    Object.keys(byRound).sort((a, b) => b - a).forEach(round => {
      const roundName = round === '1' ? 'Finals' : 
                       round === '2' ? 'Semi-Finals' :
                       round === '3' ? 'Quarter-Finals' : 
                       `Round ${round}`;
      console.log(`   ${roundName}: ${byRound[round].length} matches (Match 1-${byRound[round].length})`);
    });

    console.log('\n✅ All matches ready to start fresh!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recreateKnockoutMatches();
