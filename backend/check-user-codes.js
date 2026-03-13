import prisma from './src/lib/prisma.js';

async function checkUserCodes() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        playerCode: true,
        umpireCode: true
      }
    });

    console.log('\n📊 User Codes Status:\n');
    console.log('Total users:', users.length);
    console.log('\n');

    users.forEach(user => {
      console.log(`👤 ${user.name || user.email}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Player Code: ${user.playerCode || '❌ MISSING'}`);
      console.log(`   Umpire Code: ${user.umpireCode || '❌ MISSING'}`);
      console.log('');
    });

    const missingCodes = users.filter(u => !u.playerCode || !u.umpireCode);
    if (missingCodes.length > 0) {
      console.log(`\n⚠️  ${missingCodes.length} users are missing codes\n`);
    } else {
      console.log('\n✅ All users have codes!\n');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkUserCodes();
