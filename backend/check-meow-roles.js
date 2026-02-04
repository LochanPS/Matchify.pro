import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMeow() {
  try {
    const meow = await prisma.user.findUnique({
      where: { email: 'meow@gmail.com' },
      select: { id: true, name: true, email: true, roles: true }
    });

    console.log('Meow user:', JSON.stringify(meow, null, 2));
    
    if (meow) {
      console.log('\nRoles check:');
      console.log('- Has UMPIRE role:', meow.roles?.includes('UMPIRE'));
      console.log('- Has PLAYER role:', meow.roles?.includes('PLAYER'));
      console.log('- Has ORGANIZER role:', meow.roles?.includes('ORGANIZER'));
    } else {
      console.log('❌ Meow user not found!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMeow();
