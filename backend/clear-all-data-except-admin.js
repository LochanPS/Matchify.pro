// Clear all data except admin - Complete database cleanup
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllDataExceptAdmin() {
  try {
    console.log('🧹 Starting complete database cleanup...');
    console.log('⚠️  This will delete ALL data except admin account');
    
    // Find admin user first
    const adminUser = await prisma.user.findFirst({
      where: {
        roles: {
          contains: 'ADMIN'
        }
      }
    });
    
    if (!adminUser) {
      console.error('❌ No admin user found! Cannot proceed without admin.');
      return;
    }
    
    console.log(`✅ Admin user found: ${adminUser.name} (${adminUser.email})`);
    console.log('📋 This admin account will be preserved.');
    
    // Start cleanup process
    console.log('\n🗑️  Starting data deletion...');
    
    // 1. Delete Payment Verifications
    console.log('1. Deleting payment verifications...');
    const deletedVerifications = await prisma.paymentVerification.deleteMany({});
    console.log(`   ✅ Deleted ${deletedVerifications.count} payment verifications`);
    
    // 2. Delete User Payment Ledger
    console.log('2. Deleting user payment ledger...');
    const deletedLedger = await prisma.userPaymentLedger.deleteMany({});
    console.log(`   ✅ Deleted ${deletedLedger.count} ledger entries`);
    
    // 3. Delete User Payment Summary
    console.log('3. Deleting user payment summaries...');
    const deletedSummaries = await prisma.userPaymentSummary.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSummaries.count} payment summaries`);
    
    // 4. Delete Registrations
    console.log('4. Deleting tournament registrations...');
    const deletedRegistrations = await prisma.registration.deleteMany({});
    console.log(`   ✅ Deleted ${deletedRegistrations.count} registrations`);
    
    // 5. Delete Tournament Payments
    console.log('5. Deleting tournament payments...');
    const deletedTournamentPayments = await prisma.tournamentPayment.deleteMany({});
    console.log(`   ✅ Deleted ${deletedTournamentPayments.count} tournament payments`);
    
    // 6. Delete Tournament Umpires
    console.log('6. Deleting tournament umpires...');
    const deletedUmpires = await prisma.tournamentUmpire.deleteMany({});
    console.log(`   ✅ Deleted ${deletedUmpires.count} tournament umpire assignments`);
    
    // 7. Delete Categories
    console.log('7. Deleting tournament categories...');
    const deletedCategories = await prisma.category.deleteMany({});
    console.log(`   ✅ Deleted ${deletedCategories.count} categories`);
    
    // 8. Delete Tournaments
    console.log('8. Deleting tournaments...');
    const deletedTournaments = await prisma.tournament.deleteMany({});
    console.log(`   ✅ Deleted ${deletedTournaments.count} tournaments`);
    
    // 9. Delete Academies
    console.log('9. Deleting academies...');
    const deletedAcademies = await prisma.academy.deleteMany({});
    console.log(`   ✅ Deleted ${deletedAcademies.count} academies`);
    
    // 10. Delete Wallet Transactions
    console.log('10. Deleting wallet transactions...');
    const deletedWalletTransactions = await prisma.walletTransaction.deleteMany({});
    console.log(`   ✅ Deleted ${deletedWalletTransactions.count} wallet transactions`);
    
    // 11. Delete Wallets
    console.log('11. Deleting wallets...');
    const deletedWallets = await prisma.wallet.deleteMany({});
    console.log(`   ✅ Deleted ${deletedWallets.count} wallets`);
    
    // 12. Delete Partner Confirmations
    console.log('12. Deleting partner confirmations...');
    try {
      const deletedPartnerConfirmations = await prisma.partnerConfirmation.deleteMany({});
      console.log(`   ✅ Deleted ${deletedPartnerConfirmations.count} partner confirmations`);
    } catch (error) {
      console.log(`   ⚠️  Partner confirmations table might not exist: ${error.message}`);
    }
    
    // 13. Delete any other user-related data
    console.log('13. Deleting other user-related data...');
    try {
      // Delete any other tables that might reference users
      const deletedOtherData = await prisma.$executeRaw`
        DELETE FROM "RefreshToken" WHERE "userId" != ${adminUser.id};
      `;
      console.log(`   ✅ Deleted refresh tokens`);
    } catch (error) {
      console.log(`   ⚠️  Some tables might not exist: ${error.message}`);
    }
    
    // 14. Delete Notifications (except admin notifications)
    console.log('14. Deleting notifications (keeping admin notifications)...');
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        userId: {
          not: adminUser.id
        }
      }
    });
    console.log(`   ✅ Deleted ${deletedNotifications.count} notifications`);
    
    // 15. Delete All Users Except Admin
    console.log('15. Deleting all users except admin...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: {
          not: adminUser.id
        }
      }
    });
    console.log(`   ✅ Deleted ${deletedUsers.count} users (kept admin)`);
    
    // 16. Clear Admin Notifications (optional - you can keep them)
    console.log('16. Clearing admin notifications...');
    const deletedAdminNotifications = await prisma.notification.deleteMany({
      where: {
        userId: adminUser.id
      }
    });
    console.log(`   ✅ Deleted ${deletedAdminNotifications.count} admin notifications`);
    
    // Verification - Check what's left
    console.log('\n📊 Database cleanup complete! Checking remaining data...');
    
    const remainingData = await Promise.all([
      prisma.user.count(),
      prisma.tournament.count(),
      prisma.registration.count(),
      prisma.paymentVerification.count(),
      prisma.userPaymentLedger.count(),
      prisma.userPaymentSummary.count(),
      prisma.notification.count(),
      prisma.academy.count(),
      prisma.category.count()
    ]);
    
    console.log('\n✅ CLEANUP SUMMARY:');
    console.log(`   Users remaining: ${remainingData[0]} (should be 1 - admin only)`);
    console.log(`   Tournaments: ${remainingData[1]} (should be 0)`);
    console.log(`   Registrations: ${remainingData[2]} (should be 0)`);
    console.log(`   Payment Verifications: ${remainingData[3]} (should be 0)`);
    console.log(`   User Ledger Entries: ${remainingData[4]} (should be 0)`);
    console.log(`   Payment Summaries: ${remainingData[5]} (should be 0)`);
    console.log(`   Notifications: ${remainingData[6]} (should be 0)`);
    console.log(`   Academies: ${remainingData[7]} (should be 0)`);
    console.log(`   Categories: ${remainingData[8]} (should be 0)`);
    
    // Show remaining admin user
    const finalAdmin = await prisma.user.findUnique({
      where: { id: adminUser.id }
    });
    
    console.log('\n👤 REMAINING ADMIN USER:');
    console.log(`   ID: ${finalAdmin.id}`);
    console.log(`   Name: ${finalAdmin.name}`);
    console.log(`   Email: ${finalAdmin.email}`);
    console.log(`   Roles: ${finalAdmin.roles}`);
    
    console.log('\n🎉 DATABASE CLEANUP COMPLETE!');
    console.log('✅ All revenue data cleared (everything is now zero)');
    console.log('✅ All users deleted except admin');
    console.log('✅ All tournaments and resources deleted');
    console.log('✅ All registrations and payments deleted');
    console.log('✅ Admin account preserved and ready to use');
    
    console.log('\n🚀 You can now start fresh with a clean database!');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllDataExceptAdmin();