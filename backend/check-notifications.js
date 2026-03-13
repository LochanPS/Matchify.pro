import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkNotifications() {
  // Get PS Pradyumna's user ID
  const user = await prisma.user.findFirst({
    where: {
      email: 'pokkalipradyumna@gmail.com'
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });
  
  console.log('User:', user);
  
  // Get all notifications for this user
  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });
  
  console.log(`\nFound ${notifications.length} notifications:\n`);
  
  notifications.forEach((notif, index) => {
    console.log(`${index + 1}. ${notif.type} - ${notif.title}`);
    console.log(`   Message: ${notif.message.substring(0, 100)}...`);
    console.log(`   Read: ${notif.read}`);
    console.log(`   Created: ${notif.createdAt}`);
    console.log('');
  });
  
  await prisma.$disconnect();
}

checkNotifications();
