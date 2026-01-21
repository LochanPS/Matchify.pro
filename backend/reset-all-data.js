import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAllData() {
  try {
    console.log('🗑️  Starting complete data reset...\n');

    // Delete in correct order to respect foreign key constraints
    
    console.log('1️⃣ Deleting tournament payments...');
    const tournamentPayments = await prisma.tournamentPayment.deleteMany({});
    console.log(`   ✅ Deleted ${tournamentPayments.count} tournament payment records`);

    console.log('\n2️⃣ Deleting payment verifications...');
    const paymentVerifications = await prisma.paymentVerification.deleteMany({});
    console.log(`   ✅ Deleted ${paymentVerifications.count} payment verification records`);

    console.log('\n3️⃣ Deleting matches...');
    const matches = await prisma.match.deleteMany({});
    console.log(`   ✅ Deleted ${matches.count} match records`);

    console.log('\n4️⃣ Deleting draws...');
    const draws = await prisma.draw.deleteMany({});
    console.log(`   ✅ Deleted ${draws.count} draw records`);

    console.log('\n5️⃣ Deleting registrations...');
    const registrations = await prisma.registration.deleteMany({});
    console.log(`   ✅ Deleted ${registrations.count} registration records`);

    console.log('\n6️⃣ Deleting tournament umpires...');
    const tournamentUmpires = await prisma.tournamentUmpire.deleteMany({});
    console.log(`   ✅ Deleted ${tournamentUmpires.count} tournament umpire records`);

    console.log('\n7️⃣ Deleting tournaments...');
    const tournaments = await prisma.tournament.deleteMany({});
    console.log(`   ✅ Deleted ${tournaments.count} tournament records`);

    console.log('\n8️⃣ Deleting notifications...');
    const notifications = await prisma.notification.deleteMany({});
    console.log(`   ✅ Deleted ${notifications.count} notification records`);

    console.log('\n9️⃣ Resetting user stats...');
    const users = await prisma.user.updateMany({
      data: {
        walletBalance: 0,
        totalPoints: 0,
        tournamentsPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        tournamentsRegistered: 0,
        matchesUmpired: 0
      }
    });
    console.log(`   ✅ Reset stats for ${users.count} users`);

    console.log('\n✅ Complete data reset finished!\n');
    console.log('📊 Summary:');
    console.log(`   - Tournament Payments: ${tournamentPayments.count}`);
    console.log(`   - Payment Verifications: ${paymentVerifications.count}`);
    console.log(`   - Matches: ${matches.count}`);
    console.log(`   - Draws: ${draws.count}`);
    console.log(`   - Registrations: ${registrations.count}`);
    console.log(`   - Tournament Umpires: ${tournamentUmpires.count}`);
    console.log(`   - Tournaments: ${tournaments.count}`);
    console.log(`   - Notifications: ${notifications.count}`);
    console.log(`   - Users Reset: ${users.count}`);
    console.log('\n🎯 System is now clean and ready for fresh start!');

  } catch (error) {
    console.error('❌ Error during reset:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllData();
