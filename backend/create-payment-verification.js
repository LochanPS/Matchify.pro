// Create PaymentVerification record for existing registration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createPaymentVerification() {
  try {
    console.log('🔧 Creating PaymentVerification record...');
    
    // Find the existing registration
    const registration = await prisma.registration.findFirst({
      where: {
        paymentScreenshot: { not: null },
        status: 'pending'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        tournament: {
          select: { id: true, name: true }
        },
        category: {
          select: { name: true }
        }
      }
    });
    
    if (!registration) {
      console.log('No pending registration found');
      return;
    }
    
    console.log(`Creating PaymentVerification for: ${registration.user.name}`);
    
    // Check if verification record already exists
    const existingVerification = await prisma.paymentVerification.findUnique({
      where: { registrationId: registration.id }
    });
    
    if (existingVerification) {
      console.log('✅ PaymentVerification record already exists');
      console.log('Verification ID:', existingVerification.id);
      console.log('Status:', existingVerification.status);
      console.log('Screenshot:', existingVerification.paymentScreenshot ? 'Yes' : 'No');
      return;
    }
    
    // Create PaymentVerification record
    const verification = await prisma.paymentVerification.create({
      data: {
        registrationId: registration.id,
        userId: registration.userId,
        tournamentId: registration.tournamentId,
        amount: registration.amountTotal,
        paymentScreenshot: registration.paymentScreenshot,
        status: 'pending',
        submittedAt: registration.createdAt,
      }
    });
    
    console.log('✅ PaymentVerification record created successfully');
    console.log('Verification ID:', verification.id);
    console.log('Amount:', `₹${verification.amount}`);
    console.log('Screenshot URL:', verification.paymentScreenshot);
    console.log('Status:', verification.status);
    
    // Test the verification endpoints
    console.log('\n🔍 Testing verification system...');
    console.log('Admin can now:');
    console.log(`1. View verification: GET /api/admin/payment-verifications`);
    console.log(`2. Approve payment: POST /api/admin/payment-verifications/${verification.id}/approve`);
    console.log(`3. Reject payment: POST /api/admin/payment-verifications/${verification.id}/reject`);
    
  } catch (error) {
    console.error('❌ Error creating PaymentVerification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPaymentVerification();