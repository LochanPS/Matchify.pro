// Verify database is clean - only admin remains
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCleanDatabase() {
  try {
    console.log('🔍 VERIFYING CLEAN DATABASE STATE');
    
    // Check all main tables
    const verification = {
      users: await prisma.user.count(),
      tournaments: await prisma.tournament.count(),
      registrations: await prisma.registration.count(),
      categories: await prisma.category.count(),
      notifications: await prisma.notification.count(),
      walletTransactions: await prisma.walletTransaction.count()
    };
    
    console.log('\n📊 DATABASE STATE:');
    console.log(`   Users: ${verification.users} (should be 1 - admin only)`);
    console.log(`   Tournaments: ${verification.tournaments} (should be 0)`);
    console.log(`   Registrations: ${verification.registrations} (should be 0)`);
    console.log(`   Categories: ${verification.categories} (should be 0)`);
    console.log(`   Notifications: ${verification.notifications} (should be 0)`);
    console.log(`   Wallet Transactions: ${verification.walletTransactions} (should be 0)`);
    
    // Check admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        roles: {
          contains: 'ADMIN'
        }
      }
    });
    
    if (adminUser) {
      console.log('\n👤 ADMIN USER VERIFIED:');
      console.log(`   ✅ ID: ${adminUser.id}`);
      console.log(`   ✅ Name: ${adminUser.name}`);
      console.log(`   ✅ Email: ${adminUser.email}`);
      console.log(`   ✅ Roles: ${adminUser.roles}`);
      console.log(`   ✅ Created: ${adminUser.createdAt}`);
    } else {
      console.log('\n❌ NO ADMIN USER FOUND!');
    }
    
    // Check if database is truly clean
    const isClean = 
      verification.users === 1 &&
      verification.tournaments === 0 &&
      verification.registrations === 0 &&
      verification.categories === 0 &&
      verification.notifications === 0 &&
      verification.walletTransactions === 0 &&
      adminUser;
    
    if (isClean) {
      console.log('\n🎉 DATABASE IS PERFECTLY CLEAN!');
      console.log('✅ Only admin user remains');
      console.log('✅ All revenue data cleared (₹0)');
      console.log('✅ All tournaments deleted');
      console.log('✅ All users deleted except admin');
      console.log('✅ All registrations and payments deleted');
      console.log('✅ Ready for fresh start!');
    } else {
      console.log('\n⚠️  Database cleanup may be incomplete');
      console.log('Some data might still remain');
    }
    
    console.log('\n🚀 ADMIN CAN NOW:');
    console.log('   • Login with existing credentials');
    console.log('   • Create new tournaments');
    console.log('   • Manage fresh registrations');
    console.log('   • Start with zero revenue');
    console.log('   • Have complete control');
    
  } catch (error) {
    console.error('❌ Error verifying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCleanDatabase();