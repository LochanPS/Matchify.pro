import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'P@gmail.com' },
      select: {
        email: true,
        name: true,
        roles: true,
        playerCode: true,
        umpireCode: true
      }
    });

    console.log('User data:');
    console.log(JSON.stringify(user, null, 2));
    
    if (user && user.roles) {
      const rolesArray = user.roles.split(',').map(r => r.trim());
      console.log('\nRoles as array:', rolesArray);
      console.log('Number of roles:', rolesArray.length);
    }

    if (!user.playerCode || !user.umpireCode) {
      console.log('\n⚠️  WARNING: User is missing codes!');
      if (!user.playerCode) console.log('   - Missing Player Code');
      if (!user.umpireCode) console.log('   - Missing Umpire Code');
    } else {
      console.log('\n✅ User has both codes:');
      console.log('   Player Code:', user.playerCode);
      console.log('   Umpire Code:', user.umpireCode);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
