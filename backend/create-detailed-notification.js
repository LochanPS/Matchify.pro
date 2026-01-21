// Create a detailed admin notification for the existing registration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDetailedNotification() {
  try {
    console.log('🔧 Creating detailed admin notification...');
    
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
    
    // Find the recent registration
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
          select: { 
            id: true, 
            name: true, 
            city: true, 
            state: true,
            startDate: true,
            endDate: true
          }
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
    
    console.log(`Creating detailed notification for: ${registration.user.name}`);
    
    // Create detailed admin notification
    await prisma.notification.create({
      data: {
        userId: adminUser.id,
        type: 'PAYMENT_VERIFICATION_REQUIRED',
        title: '🔔 New Tournament Registration - Payment Verification Required',
        message: `
📋 REGISTRATION DETAILS:
👤 Player: ${registration.user.name}
📧 Email: ${registration.user.email}
🏆 Tournament: ${registration.tournament.name}
📍 Location: ${registration.tournament.city}, ${registration.tournament.state}
📅 Tournament Date: ${registration.tournament.startDate} to ${registration.tournament.endDate}
🎯 Category: ${registration.category.name}
💰 Amount: ₹${registration.amountTotal}
📸 Payment Screenshot: Submitted
⏰ Registered: ${registration.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

🔍 ACTION REQUIRED:
Please verify the payment screenshot and approve/reject this registration.
Go to Admin Panel → Payment Verification to review.

⚠️ This registration is pending your approval.
        `.trim(),
        data: JSON.stringify({
          registrationId: registration.id,
          playerName: registration.user.name,
          playerEmail: registration.user.email,
          tournamentId: registration.tournament.id,
          tournamentName: registration.tournament.name,
          tournamentLocation: `${registration.tournament.city}, ${registration.tournament.state}`,
          tournamentDates: `${registration.tournament.startDate} to ${registration.tournament.endDate}`,
          category: registration.category.name,
          amount: registration.amountTotal,
          paymentScreenshot: registration.paymentScreenshot,
          registrationTime: registration.createdAt.toISOString(),
          urgent: true,
          actionRequired: 'PAYMENT_VERIFICATION',
          detailed: true
        }),
      },
    });
    
    console.log('✅ Detailed admin notification created successfully');
    
    // Show the notification
    const newNotification = await prisma.notification.findFirst({
      where: {
        userId: adminUser.id,
        type: 'PAYMENT_VERIFICATION_REQUIRED'
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n📬 New notification preview:');
    console.log('Title:', newNotification.title);
    console.log('Message:');
    console.log(newNotification.message);
    
  } catch (error) {
    console.error('❌ Error creating detailed notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDetailedNotification();