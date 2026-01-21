import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('📋 Listing all users in database...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (users.length === 0) {
      console.log('⚠️  No users found in database!');
    } else {
      console.log(`Found ${users.length} users:\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Roles: ${Array.isArray(user.roles) ? user.roles.join(', ') : user.roles || 'None'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
