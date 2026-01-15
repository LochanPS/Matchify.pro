import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllUsers() {
  try {
    console.log('🗑️  Starting user cleanup...\n');

    // Delete in order to respect foreign key constraints
    const deletions = [];

    try {
      console.log('Deleting credit transactions...');
      const creditTransactions = await prisma.creditTransaction.deleteMany({});
      deletions.push(`Credit Transactions: ${creditTransactions.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting matchify credits...');
      const credits = await prisma.matchifyCredits.deleteMany({});
      deletions.push(`Matchify Credits: ${credits.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting score correction requests...');
      const corrections = await prisma.scoreCorrectionRequest.deleteMany({});
      deletions.push(`Score Corrections: ${corrections.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting matches...');
      const matches = await prisma.match.deleteMany({});
      deletions.push(`Matches: ${matches.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting draws...');
      const draws = await prisma.draw.deleteMany({});
      deletions.push(`Draws: ${draws.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting registrations...');
      const registrations = await prisma.registration.deleteMany({});
      deletions.push(`Registrations: ${registrations.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting categories...');
      const categories = await prisma.category.deleteMany({});
      deletions.push(`Categories: ${categories.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting tournament posters...');
      const posters = await prisma.tournamentPoster.deleteMany({});
      deletions.push(`Tournament Posters: ${posters.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting tournament umpires...');
      const tournamentUmpires = await prisma.tournamentUmpire.deleteMany({});
      deletions.push(`Tournament Umpires: ${tournamentUmpires.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting tournaments...');
      const tournaments = await prisma.tournament.deleteMany({});
      deletions.push(`Tournaments: ${tournaments.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting notifications...');
      const notifications = await prisma.notification.deleteMany({});
      deletions.push(`Notifications: ${notifications.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting wallet transactions...');
      const walletTransactions = await prisma.walletTransaction.deleteMany({});
      deletions.push(`Wallet Transactions: ${walletTransactions.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting audit logs...');
      const auditLogs = await prisma.auditLog.deleteMany({});
      deletions.push(`Audit Logs: ${auditLogs.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting admin invites...');
      const adminInvites = await prisma.adminInvite.deleteMany({});
      deletions.push(`Admin Invites: ${adminInvites.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting SMS logs...');
      const smsLogs = await prisma.smsLog.deleteMany({});
      deletions.push(`SMS Logs: ${smsLogs.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting player profiles...');
      const playerProfiles = await prisma.playerProfile.deleteMany({});
      deletions.push(`Player Profiles: ${playerProfiles.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting organizer profiles...');
      const organizerProfiles = await prisma.organizerProfile.deleteMany({});
      deletions.push(`Organizer Profiles: ${organizerProfiles.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    try {
      console.log('Deleting umpire profiles...');
      const umpireProfiles = await prisma.umpireProfile.deleteMany({});
      deletions.push(`Umpire Profiles: ${umpireProfiles.count}`);
    } catch (e) {
      console.log('⚠️  Table not found, skipping...');
    }

    console.log('Deleting all users...');
    const users = await prisma.user.deleteMany({});
    deletions.push(`Users: ${users.count}`);

    console.log('\n✨ Database cleanup complete!');
    console.log('📊 Deleted:');
    deletions.forEach(item => console.log(`   - ${item}`));
    console.log('\n⚠️  Note: Admin account (ADMIN@gmail.com) is hardcoded and not affected.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllUsers();
