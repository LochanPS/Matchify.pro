import prisma from './src/lib/prisma.js';

async function checkAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isActive: true,
        profilePhoto: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`\n✅ Found ${users.length} users:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Roles: ${user.roles}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Has Photo: ${user.profilePhoto ? 'Yes' : 'No'}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUsers();
