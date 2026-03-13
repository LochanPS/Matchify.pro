import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNotifications() {
  try {
    const meow = await prisma.user.findUnique({
      where: { email: 'meow@gmail.com' },
      select: { id: true, name: true, email: true }
    });

    if (!meow) {
      console.log('❌ Meow user not found!');
      return;
    }

    console.log('✅ Meow user:', meow);
    console.log('\n📧 Checking notifications for Meow...\n');

    const notifications = await prisma.notification.findMany({
      where: { userId: meow.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`Found ${notifications.length} notifications:\n`);

    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title}`);
      console.log(`   Type: ${notif.type}`);
      console.log(`   Message: ${notif.message.substring(0, 100)}...`);
      console.log(`   Created: ${notif.createdAt}`);
      console.log(`   Read: ${notif.isRead ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Check specifically for MATCH_ASSIGNED notifications
    const matchAssignedNotifs = notifications.filter(n => n.type === 'MATCH_ASSIGNED');
    console.log(`\n⚖️ Match Assignment notifications: ${matchAssignedNotifs.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotifications();
