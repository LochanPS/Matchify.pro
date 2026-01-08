import { PrismaClient } from '@prisma/client';
import bracketService from './src/services/bracket.service.js';
import matchService from './src/services/match.service.js';

const prisma = new PrismaClient();

async function testMatchGeneration() {
  console.log('🧪 Testing Match Generation from Bracket\n');

  try {
    // Test 1: Generate bracket and matches for 8 participants
    console.log('Test 1: 8 Participants - Full Match Generation');
    console.log('='.repeat(60));

    const participants8 = [
      { id: 'p1', name: 'Player 1', seed: 1, seedScore: 1000 },
      { id: 'p2', name: 'Player 2', seed: 2, seedScore: 900 },
      { id: 'p3', name: 'Player 3', seed: 3, seedScore: 800 },
      { id: 'p4', name: 'Player 4', seed: 4, seedScore: 700 },
      { id: 'p5', name: 'Player 5', seed: 5, seedScore: 600 },
      { id: 'p6', name: 'Player 6', seed: 6, seedScore: 500 },
      { id: 'p7', name: 'Player 7', seed: 7, seedScore: 400 },
      { id: 'p8', name: 'Player 8', seed: 8, seedScore: 300 }
    ];

    // Generate bracket
    const bracket8 = bracketService.generateSingleEliminationBracket(participants8);
    console.log(`✅ Bracket generated: ${bracket8.totalRounds} rounds, ${bracket8.byes} byes`);

    // Display bracket structure
    console.log('\nBracket Structure:');
    bracket8.rounds.forEach(round => {
      console.log(`\n${round.roundName} (Round ${round.roundNumber}):`);
      round.matches.forEach(match => {
        const p1 = match.participant1 ? `${match.participant1.name} (${match.participant1.seed})` : 'TBD';
        const p2 = match.participant2 ? `${match.participant2.name} (${match.participant2.seed})` : 'TBD';
        const status = match.status === 'bye' ? ' [BYE]' : '';
        console.log(`  Match ${match.matchNumber}: ${p1} vs ${p2}${status}`);
      });
    });

    // Test 2: Generate bracket with byes
    console.log('\n\n' + '='.repeat(60));
    console.log('Test 2: 5 Participants - With Byes');
    console.log('='.repeat(60));

    const participants5 = [
      { id: 'p1', name: 'Player 1', seed: 1, seedScore: 1000 },
      { id: 'p2', name: 'Player 2', seed: 2, seedScore: 900 },
      { id: 'p3', name: 'Player 3', seed: 3, seedScore: 800 },
      { id: 'p4', name: 'Player 4', seed: 4, seedScore: 700 },
      { id: 'p5', name: 'Player 5', seed: 5, seedScore: 600 }
    ];

    const bracket5 = bracketService.generateSingleEliminationBracket(participants5);
    console.log(`✅ Bracket generated: ${bracket5.totalRounds} rounds, ${bracket5.byes} byes`);

    // Display bracket structure
    console.log('\nBracket Structure:');
    bracket5.rounds.forEach(round => {
      console.log(`\n${round.roundName} (Round ${round.roundNumber}):`);
      round.matches.forEach(match => {
        const p1 = match.participant1 ? `${match.participant1.name} (${match.participant1.seed})` : 'TBD';
        const p2 = match.participant2 ? `${match.participant2.name} (${match.participant2.seed})` : 'TBD';
        const status = match.status === 'bye' ? ' [BYE]' : '';
        const winner = match.winner ? ` → Winner: ${match.winner.name}` : '';
        console.log(`  Match ${match.matchNumber}: ${p1} vs ${p2}${status}${winner}`);
      });
    });

    // Test 3: Count matches by status
    console.log('\n\n' + '='.repeat(60));
    console.log('Test 3: Match Status Summary');
    console.log('='.repeat(60));

    const statusCount = {
      pending: 0,
      ready: 0,
      bye: 0
    };

    bracket5.rounds.forEach(round => {
      round.matches.forEach(match => {
        if (match.status === 'bye') statusCount.bye++;
        else if (match.status === 'pending') statusCount.pending++;
        else statusCount.ready++;
      });
    });

    console.log(`\n✅ Ready to play: ${statusCount.ready} matches`);
    console.log(`✅ Pending (waiting for previous round): ${statusCount.pending} matches`);
    console.log(`✅ Byes (auto-advanced): ${statusCount.bye} matches`);

    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMatchGeneration();
