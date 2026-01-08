import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNotifications() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('Recent Notifications:', JSON.stringify(notifications, null, 2));
    
    // Also check users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });
    console.log('\nUsers:', JSON.stringify(users, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotifications();
