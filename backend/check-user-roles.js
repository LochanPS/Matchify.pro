import prisma from './src/lib/prisma.js';

async function checkUserRoles() {
  try {
    console.log('🔍 Checking user roles in database...\n');

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roles: true
      }
    });

    console.log(`Found ${users.length} users:\n`);

    users.forEach(user => {
      console.log(`📧 ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Roles: ${user.roles}`);
      console.log(`   Type: ${typeof user.roles}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRoles();
