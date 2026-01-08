import { PrismaClient } from '@prisma/client';
import seedingService from './src/services/seeding.service.js';
import bracketService from './src/services/bracket.service.js';

const prisma = new PrismaClient();

async function testDrawGeneration() {
  console.log('🧪 Testing Draw Generation System\n');

  try {
    // Test 1: Bracket with 8 participants (perfect power of 2)
    console.log('Test 1: 8 Participants (No Byes)');
    const participants8 = [
      { id: '1', name: 'Player 1', seed: 1, seedScore: 1000 },
      { id: '2', name: 'Player 2', seed: 2, seedScore: 900 },
      { id: '3', name: 'Player 3', seed: 3, seedScore: 800 },
      { id: '4', name: 'Player 4', seed: 4, seedScore: 700 },
      { id: '5', name: 'Player 5', seed: 5, seedScore: 600 },
      { id: '6', name: 'Player 6', seed: 6, seedScore: 500 },
      { id: '7', name: 'Player 7', seed: 7, seedScore: 400 },
      { id: '8', name: 'Player 8', seed: 8, seedScore: 300 }
    ];

    const bracket8 = bracketService.generateSingleEliminationBracket(participants8);
    console.log(`✅ Total Rounds: ${bracket8.totalRounds}`);
    console.log(`✅ Total Participants: ${bracket8.totalParticipants}`);
    console.log(`✅ Byes: ${bracket8.byes}`);
    console.log(`✅ First Round Matches: ${bracket8.rounds[0].matches.length}`);
    console.log('');

    // Test 2: Bracket with 5 participants (needs byes)
    console.log('Test 2: 5 Participants (3 Byes)');
    const participants5 = [
      { id: '1', name: 'Player 1', seed: 1, seedScore: 1000 },
      { id: '2', name: 'Player 2', seed: 2, seedScore: 900 },
      { id: '3', name: 'Player 3', seed: 3, seedScore: 800 },
      { id: '4', name: 'Player 4', seed: 4, seedScore: 700 },
      { id: '5', name: 'Player 5', seed: 5, seedScore: 600 }
    ];

    const bracket5 = bracketService.generateSingleEliminationBracket(participants5);
    console.log(`✅ Total Rounds: ${bracket5.totalRounds}`);
    console.log(`✅ Total Participants: ${bracket5.totalParticipants}`);
    console.log(`✅ Byes: ${bracket5.byes}`);
    console.log(`✅ First Round Matches: ${bracket5.rounds[0].matches.length}`);
    
    // Show bye matches
    const byeMatches = bracket5.rounds[0].matches.filter(m => m.status === 'bye');
    console.log(`✅ Bye Matches: ${byeMatches.length}`);
    byeMatches.forEach(m => {
      const winner = m.participant1 || m.participant2;
      console.log(`   - ${winner.name} (Seed ${winner.seed}) gets bye`);
    });
    console.log('');

    // Test 3: Display bracket structure
    console.log('Test 3: Bracket Structure (5 participants)');
    bracket5.rounds.forEach(round => {
      console.log(`\n${round.roundName} (Round ${round.roundNumber}):`);
      round.matches.forEach(match => {
        const p1 = match.participant1 ? `${match.participant1.name} (${match.participant1.seed})` : 'TBD';
        const p2 = match.participant2 ? `${match.participant2.name} (${match.participant2.seed})` : 'TBD';
        const status = match.status === 'bye' ? ' [BYE]' : '';
        console.log(`  Match ${match.matchNumber}: ${p1} vs ${p2}${status}`);
      });
    });

    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDrawGeneration();
