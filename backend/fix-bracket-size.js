import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBracketSize() {
  try {
    console.log('🔧 FIXING BRACKET SIZE...\n');

    // Get the tournament
    const tournament = await prisma.tournament.findFirst({
      where: { name: 'ace badminton' }
    });

    if (!tournament) {
      console.log('❌ Tournament not found');
      return;
    }

    // Get the category
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

    // Count registered players
    const registrations = await prisma.registration.count({
      where: {
        tournamentId: tournament.id,
        categoryId: category.id,
        status: 'confirmed'
      }
    });

    console.log(`📊 Registered players: ${registrations}`);

    // Calculate correct bracket size (next power of 2)
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(2, registrations))));
    console.log(`🎯 Correct bracket size: ${bracketSize}`);

    // Get existing draw
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

    console.log(`📋 Current bracket size: ${bracketJson.bracketSize}`);

    if (bracketJson.bracketSize === bracketSize) {
      console.log('✅ Bracket size is already correct!');
      return;
    }

    // Generate new bracket with correct size
    console.log(`\n🔨 Generating new bracket with size ${bracketSize}...`);
    
    const numRounds = Math.log2(bracketSize);
    const rounds = [];

    for (let round = 0; round < numRounds; round++) {
      const numMatches = bracketSize / Math.pow(2, round + 1);
      const matches = [];
      for (let i = 0; i < numMatches; i++) {
        if (round === 0) {
          matches.push({
            matchNumber: i + 1,
            player1: { id: null, name: `Slot ${i * 2 + 1}`, seed: i * 2 + 1 },
            player2: { id: null, name: `Slot ${i * 2 + 2}`, seed: i * 2 + 2 },
            score1: null, score2: null, winner: null
          });
        } else {
          matches.push({
            matchNumber: i + 1,
            player1: { id: null, name: 'TBD', seed: null },
            player2: { id: null, name: 'TBD', seed: null },
            score1: null, score2: null, winner: null
          });
        }
      }
      rounds.push({ roundNumber: round + 1, matches });
    }

    const newBracketJson = {
      format: 'KNOCKOUT',
      bracketSize,
      totalParticipants: 0,
      rounds
    };

    // Update draw
    await prisma.draw.update({
      where: { id: draw.id },
      data: { bracketJson: JSON.stringify(newBracketJson) }
    });

    console.log(`✅ Bracket updated to size ${bracketSize}!`);
    console.log(`   - Rounds: ${numRounds}`);
    console.log(`   - First round matches: ${bracketSize / 2}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBracketSize();
