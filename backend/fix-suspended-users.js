import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSuspendedUsers() {
  try {
    console.log('🔧 Fixing suspended users...\n');

    // Unsuspend all users
    const result = await prisma.user.updateMany({
      where: {
        OR: [
          { isSuspended: true },
          { suspendedUntil: { not: null } }
        ]
      },
      data: {
        isSuspended: false,
        suspendedUntil: null,
        suspensionReason: null,
      }
    });

    console.log(`✅ Fixed ${result.count} users`);

    // Verify
    const users = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        isSuspended: true,
        suspendedUntil: true,
      }
    });

    console.log('\n📊 Current user status:');
    users.forEach(user => {
      const suspended = user.isSuspended || (user.suspendedUntil && new Date(user.suspendedUntil) > new Date());
      console.log(`  ${user.name} - ${suspended ? '🚫 SUSPENDED' : '✅ ACTIVE'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSuspendedUsers();
