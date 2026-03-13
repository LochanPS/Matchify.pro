import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNotificationFlow() {
  try {
    console.log('🧪 Testing Notification Flow\n');

    // 1. Find PS Pradyumna
    const umpire = await prisma.user.findFirst({
      where: {
        name: {
          contains: 'PS Pradyumna',
          mode: 'insensitive'
        }
      }
    });

    if (!umpire) {
      console.log('❌ PS Pradyumna not found');
      return;
    }

    console.log('✅ Found umpire:', {
      id: umpire.id,
      name: umpire.name,
      email: umpire.email
    });

    // 2. Check notifications for this user
    const notifications = await prisma.notification.findMany({
      where: {
        userId: umpire.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log(`\n📬 Found ${notifications.length} notifications for ${umpire.name}:`);
    
    if (notifications.length === 0) {
      console.log('   No notifications found');
    } else {
      notifications.forEach((notif, index) => {
        console.log(`\n   ${index + 1}. ${notif.type}`);
        console.log(`      Title: ${notif.title}`);
        console.log(`      Message: ${notif.message}`);
        console.log(`      Read: ${notif.read}`);
        console.log(`      Created: ${notif.createdAt}`);
      });
    }

    // 3. Count unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        userId: umpire.id,
        read: false
      }
    });

    console.log(`\n📊 Unread notifications: ${unreadCount}`);

    // 4. Simulate what the API endpoint returns
    console.log('\n🔍 Simulating API Response:');
    const apiResponse = {
      success: true,
      count: notifications.length,
      unreadCount: unreadCount,
      notifications: notifications
    };
    console.log(JSON.stringify(apiResponse, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationFlow();
