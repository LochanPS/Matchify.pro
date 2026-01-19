import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isDeleted: true,
      }
    });

    console.log('\n📊 Total Users:', users.length);
    console.log('\n👥 Users in Database:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Roles: ${user.roles}`);
      console.log(`   Deleted: ${user.isDeleted}`);
      console.log('');
    });

    const activeUsers = users.filter(u => !u.isDeleted);
    const deletedUsers = users.filter(u => u.isDeleted);

    console.log(`✅ Active Users: ${activeUsers.length}`);
    console.log(`🗑️  Deleted Users: ${deletedUsers.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
