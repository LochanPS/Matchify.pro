import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roles: true
      }
    });
    
    console.log('Users:');
    users.forEach(u => {
      console.log(`- ${u.email} (${u.name}) - ID: ${u.id} - Roles: ${u.roles}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
