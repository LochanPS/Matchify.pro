import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkPaymentStatus() {
  try {
    console.log('🔍 Checking payment verification status...');
    
    // Check registrations and their payment status
    const registrations = await prisma.registration.findMany({
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        amountTotal: true,
        user: { select: { name: true, email: true } },
        tournament: { select: { name: true } }
      },
      take: 10
    });
    
    console.log(`📝 Found ${registrations.length} registrations`);
    registrations.forEach(reg => {
      console.log(`   - ${reg.user.name}: Status=${reg.status}, Payment=${reg.paymentStatus}, Amount=₹${reg.amountTotal}`);
    });
    
    // Check payment verifications
    const paymentVerifications = await prisma.paymentVerification.findMany({
      select: {
        id: true,
        status: true,
        amount: true,
        registration: {
          select: {
            user: { select: { name: true } },
            tournament: { select: { name: true } }
          }
        }
      },
      take: 10
    });
    
    console.log(`💳 Found ${paymentVerifications.length} payment verifications`);
    paymentVerifications.forEach(pv => {
      console.log(`   - ${pv.registration.user.name}: Status=${pv.status}, Amount=₹${pv.amount}`);
    });
    
    // Check payment verification counts by status
    const pendingCount = await prisma.paymentVerification.count({ where: { status: 'pending' } });
    const approvedCount = await prisma.paymentVerification.count({ where: { status: 'approved' } });
    const rejectedCount = await prisma.paymentVerification.count({ where: { status: 'rejected' } });
    
    console.log(`📊 Payment Verification Status:`);
    console.log(`   - Pending: ${pendingCount}`);
    console.log(`   - Approved: ${approvedCount}`);
    console.log(`   - Rejected: ${rejectedCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPaymentStatus();