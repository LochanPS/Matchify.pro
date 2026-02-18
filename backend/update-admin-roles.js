import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdminRoles() {
  try {
    console.log('🔄 Updating admin user roles...\n');

    const adminEmail = 'ADMIN@gmail.com';

    // Find admin user
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!admin) {
      console.log('❌ Admin user not found!');
      console.log('Please run: node create-admin-user-now.js');
      return;
    }

    console.log('📋 Current admin details:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Current Roles: ${admin.roles}`);
    console.log('');

    // Update admin to have all roles
    const updatedAdmin = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        roles: 'ADMIN,PLAYER,ORGANIZER,UMPIRE'
      }
    });

    console.log('✅ Admin roles updated successfully!');
    console.log(`   New Roles: ${updatedAdmin.roles}`);
    console.log('');
    console.log('🎉 Admin now has access to all features:');
    console.log('   ✓ Admin Dashboard (user management, payments, etc.)');
    console.log('   ✓ Player Features (register for tournaments, view draws)');
    console.log('   ✓ Organizer Features (create tournaments, manage events)');
    console.log('   ✓ Umpire Features (score matches, conduct games)');
    console.log('');
    console.log('💡 Admin can now switch between roles in the unified dashboard!');

  } catch (error) {
    console.error('❌ Error updating admin roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminRoles()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
