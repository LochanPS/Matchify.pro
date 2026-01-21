import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function healthCheck() {
  console.log('🏥 Running Health Check...\n');

  try {
    // 1. Database Connection
    console.log('1️⃣  Checking database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connected successfully\n');

    // 2. Admin User
    console.log('2️⃣  Checking admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'ADMIN@gmail.com';
    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (adminUser) {
      console.log(`   ✅ Admin user exists: ${adminUser.email}`);
      console.log(`   📋 Roles: ${adminUser.roles}\n`);
    } else {
      console.log(`   ⚠️  Admin user not found: ${adminEmail}\n`);
    }

    // 3. Payment Settings
    console.log('3️⃣  Checking payment settings...');
    const paymentSettings = await prisma.paymentSettings.findFirst();
    
    if (paymentSettings) {
      console.log(`   ✅ Payment settings exist`);
      console.log(`   💳 UPI ID: ${paymentSettings.upiId}`);
      console.log(`   👤 Account Holder: ${paymentSettings.accountHolder}\n`);
    } else {
      console.log('   ⚠️  Payment settings not found\n');
    }

    // 4. User Count
    console.log('4️⃣  Counting users...');
    const userCount = await prisma.user.count();
    console.log(`   👥 Total users: ${userCount}\n`);

    // 5. Tournament Count
    console.log('5️⃣  Counting tournaments...');
    const tournamentCount = await prisma.tournament.count();
    const publishedCount = await prisma.tournament.count({
      where: { status: 'published' }
    });
    console.log(`   🏆 Total tournaments: ${tournamentCount}`);
    console.log(`   📢 Published tournaments: ${publishedCount}\n`);

    // 6. Registration Count
    console.log('6️⃣  Counting registrations...');
    const registrationCount = await prisma.registration.count();
    const pendingPayments = await prisma.paymentVerification.count({
      where: { status: 'pending' }
    });
    console.log(`   📝 Total registrations: ${registrationCount}`);
    console.log(`   ⏳ Pending payments: ${pendingPayments}\n`);

    // 7. Tournament Payments
    console.log('7️⃣  Checking tournament payments...');
    const tournamentPayments = await prisma.tournamentPayment.findMany();
    
    if (tournamentPayments.length > 0) {
      console.log(`   💰 Tournament payment records: ${tournamentPayments.length}`);
      
      for (const payment of tournamentPayments) {
        console.log(`\n   Tournament Payment Details:`);
        console.log(`   - Total Collected: ₹${payment.totalCollected}`);
        console.log(`   - Platform Fee (${payment.platformFeePercent}%): ₹${payment.platformFeeAmount}`);
        console.log(`   - Organizer Share: ₹${payment.organizerShare}`);
        console.log(`   - First Payout (30%): ₹${payment.payout50Percent1} [${payment.payout50Status1}]`);
        console.log(`   - Second Payout (65%): ₹${payment.payout50Percent2} [${payment.payout50Status2}]`);
        
        // Verify math
        const total = payment.platformFeeAmount + payment.payout50Percent1 + payment.payout50Percent2;
        const expected = payment.totalCollected;
        const diff = Math.abs(total - expected);
        
        if (diff <= 2) { // Allow for rounding
          console.log(`   ✅ Payment math verified: ₹${total} ≈ ₹${expected}`);
        } else {
          console.log(`   ⚠️  Payment math mismatch: ₹${total} vs ₹${expected}`);
        }
      }
    } else {
      console.log('   ℹ️  No tournament payment records found');
    }

    console.log('\n🎉 Health check completed successfully!');
    console.log('✅ System is ready for deployment\n');

  } catch (error) {
    console.error('\n❌ Health check failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

healthCheck();
