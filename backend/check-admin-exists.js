import prisma from './src/lib/prisma.js';

async function checkAdminExists() {
  try {
    console.log('🔍 Checking for admin user...\n');

    // Check for admin by email
    const adminByEmail = await prisma.user.findUnique({
      where: { email: 'ADMIN@gmail.com' }
    });

    if (adminByEmail) {
      console.log('✅ Admin found by email:');
      console.log(`   ID: ${adminByEmail.id}`);
      console.log(`   Email: ${adminByEmail.email}`);
      console.log(`   Name: ${adminByEmail.name}`);
      console.log(`   Roles: ${adminByEmail.roles}`);
      console.log(`   Active: ${adminByEmail.isActive}`);
      console.log(`   Verified: ${adminByEmail.isVerified}`);
    } else {
      console.log('❌ No admin found with email ADMIN@gmail.com');
    }

    console.log('\n📊 All users with ADMIN role:');
    const allAdmins = await prisma.user.findMany({
      where: {
        roles: {
          contains: 'ADMIN'
        }
      }
    });

    if (allAdmins.length > 0) {
      allAdmins.forEach((admin, index) => {
        console.log(`\n${index + 1}. ${admin.name}`);
        console.log(`   ID: ${admin.id}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Roles: ${admin.roles}`);
      });
    } else {
      console.log('   No users with ADMIN role found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminExists();
