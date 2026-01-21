import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkStatus() {
  try {
    console.log('🔍 Checking current system status...');
    
    // Check users
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { roles: 'admin' } });
    console.log(`👥 Users: ${userCount} total, ${adminCount} admins`);
    
    // Check tournaments
    const tournaments = await prisma.tournament.findMany({
      select: { id: true, name: true, status: true }
    });
    console.log(`🏆 Tournaments: ${tournaments.length}`);
    tournaments.forEach(t => console.log(`   - ${t.name} (${t.status})`));
    
    // Check registrations
    const regCount = await prisma.registration.count();
    const confirmedRegs = await prisma.registration.count({ where: { status: 'confirmed' } });
    console.log(`📝 Registrations: ${regCount} total, ${confirmedRegs} confirmed`);
    
    // Check tournament payments
    const paymentCount = await prisma.tournamentPayment.count();
    const payments = await prisma.tournamentPayment.findMany({
      select: {
        tournamentId: true,
        totalCollected: true,
        totalRegistrations: true,
        platformFeeAmount: true,
        payout50Percent1: true,
        payout50Percent2: true
      }
    });
    console.log(`💰 Tournament Payments: ${paymentCount}`);
    payments.forEach(p => {
      console.log(`   - Total: ₹${p.totalCollected}, Regs: ${p.totalRegistrations}`);
      console.log(`     Platform Fee: ₹${p.platformFeeAmount}, 30%: ₹${p.payout50Percent1}, 65%: ₹${p.payout50Percent2}`);
    });
    
    // Verify math
    if (payments.length > 0) {
      const p = payments[0];
      const expectedPlatform = p.totalCollected * 0.05;
      const expected30 = p.totalCollected * 0.30;
      const expected65 = p.totalCollected * 0.65;
      console.log(`🧮 Math Check:`);
      console.log(`   Platform Fee: Expected ₹${expectedPlatform}, Actual ₹${p.platformFeeAmount}`);
      console.log(`   30% Payout: Expected ₹${expected30}, Actual ₹${p.payout50Percent1}`);
      console.log(`   65% Payout: Expected ₹${expected65}, Actual ₹${p.payout50Percent2}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();