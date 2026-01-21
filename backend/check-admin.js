import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.user.findFirst({
      where: { email: 'ADMIN@gmail.com' },
      select: { id: true, email: true, roles: true, name: true }
    });
    console.log('Admin user:', admin);
    
    const allUsers = await prisma.user.findMany({
      select: { email: true, roles: true },
      take: 5
    });
    console.log('Sample users:', allUsers);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();