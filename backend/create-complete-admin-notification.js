// Create complete admin notification with screenshot and verification links
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createCompleteAdminNotification() {
  try {
    console.log('🔧 Creating complete admin notification with verification options...');
    
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        roles: {
          contains: 'ADMIN'
        }
      }
    });
    
    if (!adminUser) {
      console.error('❌ No admin user found');
      return;
    }
    
    // Get all pending payment verifications
    const pendingVerifications = await prisma.paymentVerification.findMany({
      where: { status: 'pending' },
      orderBy: { submittedAt: 'desc' },
      take: 5
    });
    
    console.log(`Found ${pendingVerifications.length} pending verifications`);
    
    for (const verification of pendingVerifications) {
      // Get registration details
      const registration = await prisma.registration.findUnique({
        where: { id: verification.registrationId },
        include: {
          user: {
            select: { name: true, email: true, phone: true }
          },
          tournament: {
            select: { 
              name: true, 
              city: true, 
              state: true,
              startDate: true,
              endDate: true
            }
          },
          category: {
            select: { name: true, format: true, gender: true }
          }
        }
      });
      
      console.log(`\nCreating notification for: ${registration.user.name} - ${registration.category.name}`);
      
      // Create comprehensive admin notification
      await prisma.notification.create({
        data: {
          userId: adminUser.id,
          type: 'PAYMENT_VERIFICATION_REQUIRED',
          title: '🔔 URGENT: Payment Verification Required - Action Needed',
          message: `
🚨 PAYMENT VERIFICATION REQUIRED 🚨

📋 REGISTRATION DETAILS:
👤 Player: ${registration.user.name}
📧 Email: ${registration.user.email}
📱 Phone: ${registration.user.phone || 'Not provided'}
🏆 Tournament: ${registration.tournament.name}
📍 Location: ${registration.tournament.city}, ${registration.tournament.state}
📅 Tournament Date: ${registration.tournament.startDate} to ${registration.tournament.endDate}
🎯 Category: ${registration.category.name} (${registration.category.format} - ${registration.category.gender})
💰 Amount Paid: ₹${verification.amount}
📸 Payment Screenshot: AVAILABLE FOR REVIEW
⏰ Submitted: ${verification.submittedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

🔗 SCREENSHOT URL:
${verification.paymentScreenshot}

⚡ IMMEDIATE ACTION REQUIRED:
1. 🔍 REVIEW the payment screenshot above
2. ✅ APPROVE to register player to tournament
3. ❌ REJECT with reason if payment is invalid

🎯 QUICK ACTIONS:
• Go to: Admin Panel → Payment Verification
• Verification ID: ${verification.id}
• Status: PENDING YOUR DECISION

⚠️ Player is waiting for your approval to participate in the tournament.
          `.trim(),
          data: JSON.stringify({
            verificationId: verification.id,
            registrationId: verification.registrationId,
            playerName: registration.user.name,
            playerEmail: registration.user.email,
            playerPhone: registration.user.phone,
            tournamentId: verification.tournamentId,
            tournamentName: registration.tournament.name,
            tournamentLocation: `${registration.tournament.city}, ${registration.tournament.state}`,
            tournamentDates: `${registration.tournament.startDate} to ${registration.tournament.endDate}`,
            category: registration.category.name,
            categoryFormat: registration.category.format,
            categoryGender: registration.category.gender,
            amount: verification.amount,
            paymentScreenshot: verification.paymentScreenshot,
            submittedAt: verification.submittedAt.toISOString(),
            status: 'pending',
            urgent: true,
            actionRequired: 'PAYMENT_VERIFICATION',
            approveEndpoint: `/api/admin/payment-verifications/${verification.id}/approve`,
            rejectEndpoint: `/api/admin/payment-verifications/${verification.id}/reject`
          }),
        },
      });
      
      console.log('✅ Complete notification created with screenshot and verification options');
    }
    
    // Show summary
    const totalNotifications = await prisma.notification.count({
      where: { 
        userId: adminUser.id,
        type: 'PAYMENT_VERIFICATION_REQUIRED'
      }
    });
    
    console.log(`\n📬 Admin now has ${totalNotifications} payment verification notifications`);
    console.log('🔗 Admin Panel: http://localhost:3000/admin/payment-verification');
    console.log('📸 Screenshots are included in notifications');
    console.log('⚡ Approve/Reject options available');
    
  } catch (error) {
    console.error('❌ Error creating complete admin notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCompleteAdminNotification();