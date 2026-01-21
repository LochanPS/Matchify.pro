import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function resetPaymentsToPending() {
  try {
    console.log('🔄 Resetting all payment verifications to pending status...');
    
    // First, let's see current status
    const currentStats = await prisma.paymentVerification.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    
    console.log('📊 Current payment verification status:');
    currentStats.forEach(stat => {
      console.log(`   - ${stat.status}: ${stat._count.status}`);
    });
    
    // Update all approved payment verifications to pending
    const updateResult = await prisma.paymentVerification.updateMany({
      where: { status: 'approved' },
      data: { 
        status: 'pending',
        verifiedBy: null,
        verifiedAt: null,
        rejectionReason: null,
        rejectionType: null
      }
    });
    
    console.log(`✅ Updated ${updateResult.count} payment verifications to pending status`);
    
    // Also update the corresponding registrations to pending payment status
    const registrationUpdate = await prisma.registration.updateMany({
      where: { paymentStatus: 'verified' },
      data: { 
        paymentStatus: 'pending',
        status: 'pending'
      }
    });
    
    console.log(`✅ Updated ${registrationUpdate.count} registrations to pending status`);
    
    // Show new stats
    const newStats = await prisma.paymentVerification.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    
    console.log('📊 New payment verification status:');
    newStats.forEach(stat => {
      console.log(`   - ${stat.status}: ${stat._count.status}`);
    });
    
    // Get total count for verification
    const totalPending = await prisma.paymentVerification.count({ 
      where: { status: 'pending' } 
    });
    
    console.log(`🎉 Total pending payments ready for admin approval: ${totalPending}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPaymentsToPending();