// Simple script to fix missing admin notifications
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixNotifications() {
  try {
    console.log('🔧 Creating missing admin notifications...');
    
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
    
    console.log('✅ Admin user found:', adminUser.name, adminUser.email);
    
    // Find recent registrations with screenshots that need admin attention
    const recentRegistrations = await prisma.registration.findMany({
      where: {
        AND: [
          { paymentScreenshot: { not: null } },
          { status: 'pending' },
          { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Last 24 hours
        ]
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
    
    console.log(`\n📋 Found ${recentRegistrations.length} recent registrations needing admin notifications`);
    
    for (const registration of recentRegistrations) {
      console.log(`\n🔧 Creating notification for: ${registration.user.name} - ${registration.tournament.name}`);
      
      try {
        // Create admin notification
        await prisma.notification.create({
          data: {
            userId: adminUser.id,
            type: 'PAYMENT_VERIFICATION_REQUIRED',
            title: '🔔 Registration Needs Verification',
            message: `${registration.user.name} registered for ${registration.tournament.name} (₹${registration.amountTotal}). Please verify their payment screenshot and approve/reject.`,
            data: JSON.stringify({
              registrationId: registration.id,
              playerName: registration.user.name,
              tournamentId: registration.tournament.id,
              tournamentName: registration.tournament.name,
              amount: registration.amountTotal,
              paymentScreenshot: registration.paymentScreenshot,
              category: registration.category.name,
              urgent: true,
              backfilled: true
            }),
          },
        });
        console.log('  ✅ Created admin notification');
        
      } catch (error) {
        console.error(`  ❌ Error creating notification:`, error.message);
      }
    }
    
    // Show all notifications for admin
    const allNotifications = await prisma.notification.findMany({
      where: {
        userId: adminUser.id,
        type: 'PAYMENT_VERIFICATION_REQUIRED'
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`\n📬 Admin now has ${allNotifications.length} payment verification notifications:`);
    allNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title} - ${notif.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNotifications();