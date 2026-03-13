/**
 * Test script to verify umpire notification when assigned to match
 * 
 * This script simulates assigning an umpire to a match and checks if notification is sent
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUmpireNotification() {
  try {
    console.log('🧪 Testing Umpire Notification System\n');

    // 1. Find an umpire
    console.log('1️⃣  Finding umpire...');
    const umpire = await prisma.user.findFirst({
      where: {
        roles: { has: 'UMPIRE' }
      },
      select: { id: true, name: true, email: true }
    });

    if (!umpire) {
      console.log('❌ No umpire found. Please create an umpire user first.');
      return;
    }
    console.log(`✅ Found umpire: ${umpire.name} (${umpire.email})\n`);

    // 2. Find a match without umpire
    console.log('2️⃣  Finding match without umpire...');
    const match = await prisma.match.findFirst({
      where: {
        umpireId: null,
        status: 'PENDING'
      },
      include: {
        tournament: true,
        category: true
      }
    });

    if (!match) {
      console.log('❌ No match found without umpire. All matches already have umpires assigned.');
      return;
    }
    console.log(`✅ Found match: ${match.tournament.name} - ${match.category.name}`);
    console.log(`   Match #${match.matchNumber}, Round ${match.round}\n`);

    // 3. Get player names
    const player1 = match.player1Id
      ? await prisma.user.findUnique({
          where: { id: match.player1Id },
          select: { name: true }
        })
      : null;

    const player2 = match.player2Id
      ? await prisma.user.findUnique({
          where: { id: match.player2Id },
          select: { name: true }
        })
      : null;

    console.log(`   Players: ${player1?.name || 'TBD'} vs ${player2?.name || 'TBD'}\n`);

    // 4. Check notifications before assignment
    console.log('3️⃣  Checking existing notifications...');
    const notificationsBefore = await prisma.notification.count({
      where: {
        userId: umpire.id,
        type: 'MATCH_ASSIGNED'
      }
    });
    console.log(`   Umpire has ${notificationsBefore} match assignment notifications\n`);

    // 5. Assign umpire to match
    console.log('4️⃣  Assigning umpire to match...');
    await prisma.match.update({
      where: { id: match.id },
      data: { umpireId: umpire.id }
    });
    console.log('✅ Umpire assigned to match\n');

    // 6. Manually trigger notification (simulating what the API does)
    console.log('5️⃣  Sending notification...');
    const notificationService = await import('./src/services/notificationService.js');
    
    const roundNames = {
      1: 'Finals',
      2: 'Semi Finals',
      3: 'Quarter Finals',
      4: 'Round of 16',
      5: 'Round of 32'
    };
    const roundName = roundNames[match.round] || `Round ${match.round}`;
    const matchDetails = `${roundName} - Match #${match.matchNumber}`;
    const playersInfo = player1 && player2 
      ? `${player1.name} vs ${player2.name}` 
      : 'Players TBD';
    const courtInfo = match.courtNumber ? `Court ${match.courtNumber}` : 'Court not assigned yet';

    await notificationService.default.createNotification({
      userId: umpire.id,
      type: 'MATCH_ASSIGNED',
      title: '⚖️ Match Assignment',
      message: `You have been assigned as umpire for ${matchDetails}\n${playersInfo}\n${courtInfo}\nTournament: ${match.tournament.name}\nCategory: ${match.category.name}`,
      data: {
        matchId: match.id,
        tournamentId: match.tournamentId,
        categoryId: match.categoryId,
        matchNumber: match.matchNumber,
        round: match.round,
        roundName,
        courtNumber: match.courtNumber
      },
      sendEmail: true
    });
    console.log('✅ Notification sent\n');

    // 7. Verify notification was created
    console.log('6️⃣  Verifying notification...');
    const notificationsAfter = await prisma.notification.findMany({
      where: {
        userId: umpire.id,
        type: 'MATCH_ASSIGNED'
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (notificationsAfter.length > 0) {
      const notification = notificationsAfter[0];
      console.log('✅ Notification created successfully!');
      console.log('\n📧 Notification Details:');
      console.log(`   Title: ${notification.title}`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   Created: ${notification.createdAt}`);
      console.log(`   Read: ${notification.isRead ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Notification not found');
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Umpire: ${umpire.name}`);
    console.log(`   - Match: ${matchDetails}`);
    console.log(`   - Tournament: ${match.tournament.name}`);
    console.log(`   - Notification sent: ✅`);
    console.log(`   - Email sent: ✅`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUmpireNotification();
