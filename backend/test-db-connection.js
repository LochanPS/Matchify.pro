import prisma from './src/lib/prisma.js';

async function testConnection() {
  try {
    const users = await prisma.user.findMany({
      take: 3,
      select: { email: true, name: true, roles: true }
    });
    
    console.log('✅ Database connection successful!');
    console.log(`Total users found: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\nSample users:');
      users.forEach(u => {
        console.log(`  - ${u.email} | ${u.name} | Roles: ${u.roles}`);
      });
    } else {
      console.log('\n⚠️  No users in database.');
      console.log('Try admin login: ADMIN@gmail.com / ADMIN@123(123)');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
