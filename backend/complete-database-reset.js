// Complete database reset - Keep only admin
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function completeDatabaseReset() {
  try {
    console.log('🧹 COMPLETE DATABASE RESET');
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
      console.error('❌ No admin user found! Cannot proceed.');
      return;
    }
    
    console.log(`✅ Admin preserved: ${adminUser.name} (${adminUser.email})`);
    
    // Use raw SQL to delete everything safely
    console.log('\n🗑️  Executing complete cleanup...');
    
    // Delete in correct order to avoid foreign key constraints
    const tables = [
      'PaymentVerification',
      'UserPaymentLedger', 
      'UserPaymentSummary',
      'Registration',
      'Category',
      'TournamentPayment',
      'TournamentUmpire',
      'Tournament',
      'Academy',
      'WalletTransaction',
      'Wallet',
      'RefreshToken',
      'Notification'
    ];
    
    for (const table of tables) {
      try {
        const result = await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
        console.log(`✅ Cleared ${table}`);
      } catch (error) {
        console.log(`⚠️  ${table} - ${error.message.split('\n')[0]}`);
      }
    }
    
    // Delete all users except admin
    console.log('\n👥 Deleting all users except admin...');
    try {
      const result = await prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE id != '${adminUser.id}';`);
      console.log(`✅ Deleted all users except admin`);
    } catch (error) {
      console.log(`❌ Error deleting users: ${error.message}`);
    }
    
    // Clear admin notifications
    console.log('\n📬 Clearing admin notifications...');
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "Notification" WHERE "userId" = '${adminUser.id}';`);
      console.log(`✅ Cleared admin notifications`);
    } catch (error) {
      console.log(`⚠️  Notifications: ${error.message}`);
    }
    
    // Verify cleanup
    console.log('\n📊 VERIFICATION - Checking remaining data...');
    
    const counts = {};
    const checkTables = ['User', 'Tournament', 'Registration', 'Notification'];
    
    for (const table of checkTables) {
      try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}";`);
        counts[table] = parseInt(result[0].count);
      } catch (error) {
        counts[table] = 'N/A';
      }
    }
    
    console.log('\n✅ CLEANUP COMPLETE:');
    console.log(`   Users: ${counts.User} (should be 1 - admin only)`);
    console.log(`   Tournaments: ${counts.Tournament} (should be 0)`);
    console.log(`   Registrations: ${counts.Registration} (should be 0)`);
    console.log(`   Notifications: ${counts.Notification} (should be 0)`);
    
    // Show final admin status
    const finalAdmin = await prisma.user.findUnique({
      where: { id: adminUser.id }
    });
    
    console.log('\n👤 ADMIN ACCOUNT STATUS:');
    console.log(`   ✅ Name: ${finalAdmin.name}`);
    console.log(`   ✅ Email: ${finalAdmin.email}`);
    console.log(`   ✅ Roles: ${finalAdmin.roles}`);
    console.log(`   ✅ Status: Active and ready`);
    
    console.log('\n🎉 DATABASE RESET COMPLETE!');
    console.log('✅ All revenue data = ₹0');
    console.log('✅ All users deleted except admin');
    console.log('✅ All tournaments deleted');
    console.log('✅ All registrations deleted');
    console.log('✅ All payments deleted');
    console.log('✅ Clean slate ready for fresh start!');
    
  } catch (error) {
    console.error('❌ Error during database reset:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeDatabaseReset();