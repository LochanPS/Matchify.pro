import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testMatchScoringSystem() {
  try {
    console.log('🎾 Testing Match Scoring System...');
    
    // Get tournament and categories
    const tournament = await prisma.tournament.findFirst({
      include: {
        categories: {
          select: { id: true, name: true, format: true }
        }
      }
    });
    
    if (!tournament) {
      console.log('❌ No tournament found');
      return;
    }
    
    console.log(`🏆 Tournament: ${tournament.name}`);
    console.log(`📋 Categories: ${tournament.categories.length}`);
    
    // Get some registered users
    const users = await prisma.user.findMany({
      where: {
        roles: { contains: 'PLAYER' },
        isActive: true
      },
      take: 4,
      select: { id: true, name: true, email: true }
    });
    
    if (users.length < 2) {
      console.log('❌ Need at least 2 users for matches');
      return;
    }
    
    console.log(`👥 Found ${users.length} players`);
    
    // Create test matches for the first category
    const category = tournament.categories[0];
    if (!category) {
      console.log('❌ No category found');
      return;
    }
    
    console.log(`🎯 Creating matches for category: ${category.name}`);
    
    // Create Round 1 matches
    const matches = [];
    for (let i = 0; i < Math.min(2, Math.floor(users.length / 2)); i++) {
      const player1 = users[i * 2];
      const player2 = users[i * 2 + 1];
      
      const match = await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          categoryId: category.id,
          round: 1,
          matchNumber: i + 1,
          player1Id: player1.id,
          player2Id: player2.id,
          status: 'PENDING',
          createdAt: new Date()
        }
      });
      
      matches.push(match);
      console.log(`✅ Created Match ${i + 1}: ${player1.name} vs ${player2.name}`);
    }
    
    // Create an umpire for testing
    const umpire = await prisma.user.findFirst({
      where: {
        roles: { contains: 'UMPIRE' },
        isActive: true
      },
      select: { id: true, name: true }
    });
    
    if (umpire) {
      // Assign umpire to first match
      await prisma.match.update({
        where: { id: matches[0].id },
        data: {
          umpireId: umpire.id,
          status: 'SCHEDULED'
        }
      });
      console.log(`👨‍⚖️ Assigned umpire ${umpire.name} to Match 1`);
    }
    
    // Simulate a completed match with score
    if (matches.length > 0) {
      const testMatch = matches[0];
      const scoreData = {
        sets: [
          { player1: 21, player2: 18 },
          { player1: 19, player2: 21 },
          { player1: 21, player2: 16 }
        ],
        setsWon: { player1: 2, player2: 1 },
        winner: 'player1',
        duration: 2340, // 39 minutes in seconds
        completedAt: new Date()
      };
      
      await prisma.match.update({
        where: { id: testMatch.id },
        data: {
          status: 'COMPLETED',
          winnerId: testMatch.player1Id,
          scoreJson: JSON.stringify(scoreData),
          startedAt: new Date(Date.now() - 2340000), // 39 minutes ago
          completedAt: new Date()
        }
      });
      
      console.log(`🏁 Completed Match 1 with score: 21-18, 19-21, 21-16`);
    }
    
    // Display match summary
    console.log('\n📊 Match Summary:');
    const allMatches = await prisma.match.findMany({
      where: { tournamentId: tournament.id },
      include: {
        category: { select: { name: true } },
        umpire: { select: { name: true } }
      }
    });
    
    allMatches.forEach(match => {
      console.log(`   Match ${match.matchNumber} (${match.category.name}): ${match.status}`);
      if (match.umpire) {
        console.log(`     Umpire: ${match.umpire.name}`);
      }
      if (match.scoreJson) {
        const score = JSON.parse(match.scoreJson);
        console.log(`     Score: ${score.sets.map(s => `${s.player1}-${s.player2}`).join(', ')}`);
      }
    });
    
    console.log('\n🎉 Match Scoring System Test Complete!');
    console.log('\n📱 You can now:');
    console.log('   1. Visit /tournament/:id/draw to see tournament brackets');
    console.log('   2. Visit /match/:id/live to score matches live');
    console.log('   3. Visit /tournament/:id/results to see match results');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMatchScoringSystem();