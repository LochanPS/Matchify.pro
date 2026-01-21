import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyPendingStatus() {
  try {
    console.log('🔍 Verifying all registrations are pending admin approval...\n');

    // Find the tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: { contains: 'ace badhbhj', mode: 'insensitive' }
      }
    });

    if (!tournament) {
      console.log('❌ Tournament not found');
      return;
    }

    // Check registration statuses
    const registrationStats = await prisma.registration.groupBy({
      by: ['status', 'paymentStatus'],
      where: { tournamentId: tournament.id },
      _count: { id: true }
    });

    console.log('📋 Registration Status Summary:');
    registrationStats.forEach(stat => {
      console.log(`  - Status: ${stat.status}, Payment: ${stat.paymentStatus} → ${stat._count.id} registrations`);
    });

    // Check payment verification statuses
    const paymentVerificationStats = await prisma.paymentVerification.groupBy({
      by: ['status'],
      where: { tournamentId: tournament.id },
      _count: { id: true }
    });

    console.log('\n💰 Payment Verification Status Summary:');
    paymentVerificationStats.forEach(stat => {
      console.log(`  - Status: ${stat.status} → ${stat._count.id} verifications`);
    });

    // Check ledger entry statuses
    const ledgerStats = await prisma.userPaymentLedger.groupBy({
      by: ['status'],
      where: { tournamentId: tournament.id },
      _count: { id: true }
    });

    console.log('\n📊 User Payment Ledger Status Summary:');
    ledgerStats.forEach(stat => {
      console.log(`  - Status: ${stat.status} → ${stat._count.id} entries`);
    });

    // Check admin notifications
    const adminUser = await prisma.user.findFirst({
      where: { roles: { contains: 'ADMIN' } }
    });

    const notificationCount = await prisma.notification.count({
      where: {
        userId: adminUser.id,
        type: 'PAYMENT_VERIFICATION'
      }
    });

    console.log(`\n🔔 Admin Notifications: ${notificationCount} payment verification notifications`);

    // Check user payment summaries
    const summaryStats = await prisma.userPaymentSummary.aggregate({
      _sum: { totalCredits: true, currentBalance: true },
      _count: { id: true }
    });

    console.log(`\n👥 User Payment Summaries: ${summaryStats._count.id} users`);
    console.log(`   Total Credits: ₹${summaryStats._sum.totalCredits || 0}`);
    console.log(`   Current Balance: ₹${summaryStats._sum.currentBalance || 0}`);

    // Verify correct pending status
    const pendingRegistrations = await prisma.registration.count({
      where: {
        tournamentId: tournament.id,
        status: 'pending'
      }
    });

    const pendingPayments = await prisma.paymentVerification.count({
      where: {
        tournamentId: tournament.id,
        status: 'pending'
      }
    });

    const pendingLedger = await prisma.userPaymentLedger.count({
      where: {
        tournamentId: tournament.id,
        status: 'pending'
      }
    });

    console.log('\n✅ VERIFICATION RESULTS:');
    console.log(`   📋 Pending Registrations: ${pendingRegistrations}/128`);
    console.log(`   💰 Pending Payment Verifications: ${pendingPayments}/128`);
    console.log(`   📊 Pending Ledger Entries: ${pendingLedger}/128`);
    console.log(`   🔔 Admin Notifications: ${notificationCount}/128`);

    if (pendingRegistrations === 128 && pendingPayments === 128 && pendingLedger === 128 && notificationCount === 128) {
      console.log('\n🎉 SUCCESS: All 128 registrations are properly pending admin approval!');
      console.log('🔴 IMPORTANT: Nothing is confirmed until admin takes action');
    } else {
      console.log('\n❌ ERROR: Some registrations may not be in correct pending state');
    }

  } catch (error) {
    console.error('❌ Error verifying pending status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPendingStatus();