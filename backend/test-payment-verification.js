import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testPaymentVerification() {
  try {
    console.log('🔍 Testing PaymentVerification table...\n');

    // Test 1: Check if table exists by counting records
    console.log('Test 1: Counting payment verifications...');
    const count = await prisma.paymentVerification.count();
    console.log(`✅ PaymentVerification table exists! Found ${count} records\n`);

    // Test 2: Check if we can query with filters
    console.log('Test 2: Querying pending payments...');
    const pending = await prisma.paymentVerification.findMany({
      where: { status: 'pending' },
      take: 5
    });
    console.log(`✅ Found ${pending.length} pending payments\n`);

    // Test 3: Check TournamentPayment table
    console.log('Test 3: Checking TournamentPayment table...');
    const tournamentPayments = await prisma.tournamentPayment.count();
    console.log(`✅ TournamentPayment table exists! Found ${tournamentPayments} records\n`);

    // Test 4: Check PaymentSettings table
    console.log('Test 4: Checking PaymentSettings table...');
    const paymentSettings = await prisma.paymentSettings.findMany();
    console.log(`✅ PaymentSettings table exists! Found ${paymentSettings.length} records\n`);

    console.log('✅ All payment tables are working correctly!');

  } catch (error) {
    console.error('❌ Error testing payment verification:', error.message);
    console.error('\nFull error:', error);
    
    if (error.code === 'P2021') {
      console.error('\n⚠️  The table does not exist in the database!');
      console.error('Run: npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentVerification();
