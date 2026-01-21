// Test script to check admin notifications
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testAdminNotification() {
  try {
    console.log('🔍 Testing admin notification system...');
    
    // 1. Check if admin user exists
    const adminUser = await prisma.user.findFirst({
      where: {
        roles: {
          contains: 'ADMIN'
        }
      }
    });
    
    if (adminUser) {
      console.log('✅ Admin user found:', {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        roles: adminUser.roles
      });
    } else {
      console.log('❌ No admin user found with ADMIN role');
      
      // Try alternative search
      const altAdmin = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { contains: 'admin' } },
            { email: { contains: 'matchify.pro' } },
            { name: { contains: 'admin' } },
            { name: { contains: 'Admin' } }
          ]
        }
      });
      
      if (altAdmin) {
        console.log('⚠️ Found potential admin user:', {
          id: altAdmin.id,
          name: altAdmin.name,
          email: altAdmin.email,
          roles: altAdmin.roles
        });
      } else {
        console.log('❌ No admin-like user found');
        
        // Show all users
        const allUsers = await prisma.user.findMany({
          select: { id: true, name: true, email: true, roles: true }
        });
        console.log('\n👥 All users in database:');
        allUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.name} (${user.email}) - Roles: ${user.roles || 'none'}`);
        });
      }
    }
    
    // 2. Check recent notifications
    const recentNotifications = await prisma.notification.findMany({
      where: {
        type: 'PAYMENT_VERIFICATION_REQUIRED'
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });
    
    console.log('\n📬 Recent payment verification notifications:');
    if (recentNotifications.length === 0) {
      console.log('❌ No payment verification notifications found');
    } else {
      recentNotifications.forEach((notif, index) => {
        console.log(`${index + 1}. To: ${notif.user.name} (${notif.user.email})`);
        console.log(`   Title: ${notif.title}`);
        console.log(`   Date: ${notif.createdAt}`);
        console.log(`   Read: ${notif.read ? 'Yes' : 'No'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing admin notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminNotification();