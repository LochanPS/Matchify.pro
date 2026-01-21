import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTournamentPayments() {
  try {
    console.log('🔍 Checking Tournament Payments...\n');

    const payments = await prisma.tournamentPayment.findMany();

    if (payments.length === 0) {
      console.log('❌ No TournamentPayment records found!');
      console.log('\n💡 This means when you approved the payment, the TournamentPayment record was not created.');
      console.log('   Let me check PaymentVerifications...\n');

      const verifications = await prisma.paymentVerification.findMany({
        where: { status: 'approved' },
        include: {
          registration: {
            include: {
              tournament: {
                select: {
                  id: true,
                  name: true,
                  organizerId: true
                }
              }
            }
          }
        }
      });

      console.log(`✅ Found ${verifications.length} approved payment(s)`);
      
      for (const v of verifications) {
        console.log('\n📋 Approved Payment:');
        console.log(`   Tournament: ${v.registration.tournament.name}`);
        console.log(`   Amount: ₹${v.amount}`);
        console.log(`   Tournament ID: ${v.tournamentId}`);
        console.log(`   Organizer ID: ${v.registration.tournament.organizerId}`);
      }

      return;
    }

    console.log(`✅ Found ${payments.length} TournamentPayment record(s):\n`);

    for (const payment of payments) {
      // Fetch tournament separately to handle null case
      const tournament = await prisma.tournament.findUnique({
        where: { id: payment.tournamentId },
        select: { name: true }
      });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🏆 Tournament: ${tournament ? tournament.name : '❌ DELETED'}`);
      console.log(`   Tournament ID: ${payment.tournamentId}`);
      console.log(`💰 Total Collected: ₹${payment.totalCollected}`);
      console.log(`👥 Registrations: ${payment.totalRegistrations}`);
      console.log(`💵 Platform Fee (${payment.platformFeePercent}%): ₹${payment.platformFeeAmount}`);
      console.log(`🎯 Organizer Share: ₹${payment.organizerShare}`);
      console.log(`   ├─ First 50%: ₹${payment.payout50Percent1} (${payment.payout50Status1})`);
      console.log(`   └─ Second 50%: ₹${payment.payout50Percent2} (${payment.payout50Status2})`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTournamentPayments();
