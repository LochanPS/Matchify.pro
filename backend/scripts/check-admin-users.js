import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking for admin users...\n');
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { roles: { contains: 'ADMIN' } },
          { email: { contains: 'admin' } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true
      }
    });

    if (users.length === 0) {
      console.log('❌ No admin users found');
    } else {
      console.log(`✅ Found ${users.length} admin user(s):\n`);
      users.forEach(user => {
        console.log('---');
        console.log('Email:', user.email);
        console.log('Name:', user.name);
        console.log('Roles:', user.roles);
        console.log('ID:', user.id);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUsers();
