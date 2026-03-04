/**
 * Test Script: Tournament Points Award System
 * 
 * This script tests the automatic points award when a tournament ends.
 * Run: node test-points-award.js
 */

import { PrismaClient } from '@prisma/client';
import tournamentPointsService from './src/services/tournamentPoints.service.js';

const prisma = new PrismaClient();

async function testPointsAward() {
  console.log('🧪 Testing Tournament Points Award System\n');

  try {
    // Find a completed tournament or use a test tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        status: 'completed'
      },
      include: {
        categories: {
          include: {
            winner: { select: { name: true } },
            runnerUp: { select: { name: true } }
          }
        }
      }
    });

    if (!tournament) {
      console.log('❌ No completed tournament found');
      console.log('💡 Create a tournament, complete matches, and end it to test');
      return;
    }

    console.log(`📋 Tournament: ${tournament.name}`);
    console.log(`📊 Categories: ${tournament.categories.length}\n`);

    // Test points award for each category
    for (const category of tournament.categories) {
      console.log(`\n🎯 Category: ${category.name}`);
      console.log(`   Winner: ${category.winner?.name || 'Not set'}`);
      console.log(`   Runner-up: ${category.runnerUp?.name || 'Not set'}`);

      // Get all matches for this category
      const matches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          categoryId: category.id,
          status: 'COMPLETED'
        },
        orderBy: { round: 'asc' }
      });

      console.log(`   Completed matches: ${matches.length}`);

      // Determine placements
      const placements = tournamentPointsService.determinePlacements(matches, category);
      
      console.log('\n   📊 Placements:');
      console.log(`   🥇 Winner: ${placements.winner || 'None'}`);
      console.log(`   🥈 Runner-up: ${placements.runnerUp || 'None'}`);
      console.log(`   🥉 Semi-finalists: ${placements.semiFinalists.length} players`);
      console.log(`   🏅 Quarter-finalists: ${placements.quarterFinalists.length} players`);

      // Get all registrations
      const registrations = await prisma.registration.findMany({
        where: {
          tournamentId: tournament.id,
          categoryId: category.id,
          status: 'confirmed'
        }
      });

      const allPlayerIds = new Set();
      registrations.forEach(reg => {
        allPlayerIds.add(reg.userId);
        if (reg.partnerId) allPlayerIds.add(reg.partnerId);
      });

      // Remove placed players to get participants
      if (placements.winner) allPlayerIds.delete(placements.winner);
      if (placements.runnerUp) allPlayerIds.delete(placements.runnerUp);
      placements.semiFinalists.forEach(id => allPlayerIds.delete(id));
      placements.quarterFinalists.forEach(id => allPlayerIds.delete(id));

      console.log(`   👥 Participants: ${allPlayerIds.size} players`);

      // Calculate total points
      let totalPoints = 0;
      if (placements.winner) totalPoints += 10;
      if (placements.runnerUp) totalPoints += 8;
      totalPoints += placements.semiFinalists.length * 6;
      totalPoints += placements.quarterFinalists.length * 4;
      totalPoints += allPlayerIds.size * 2;

      console.log(`\n   💰 Total Points to Award: ${totalPoints}`);
      console.log(`   📈 Breakdown:`);
      if (placements.winner) console.log(`      - Winner: 10 points`);
      if (placements.runnerUp) console.log(`      - Runner-up: 8 points`);
      if (placements.semiFinalists.length > 0) {
        console.log(`      - Semi-finalists: ${placements.semiFinalists.length} × 6 = ${placements.semiFinalists.length * 6} points`);
      }
      if (placements.quarterFinalists.length > 0) {
        console.log(`      - Quarter-finalists: ${placements.quarterFinalists.length} × 4 = ${placements.quarterFinalists.length * 4} points`);
      }
      if (allPlayerIds.size > 0) {
        console.log(`      - Participants: ${allPlayerIds.size} × 2 = ${allPlayerIds.size * 2} points`);
      }
    }

    console.log('\n\n✅ Points calculation test complete!');
    console.log('💡 To test actual award, end a tournament via the UI');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testPointsAward();
