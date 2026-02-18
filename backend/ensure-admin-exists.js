import prisma from './src/lib/prisma.js';
import bcrypt from 'bcrypt';

async function ensureAdminExists() {
  try {
    console.log('🔍 Checking for admin user...\n');

    const adminEmail = 'ADMIN@gmail.com';
    const adminPassword = 'ADMIN@123(123)'; // Admin password

    // Check if admin exists
    let admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (admin) {
      console.log('✅ Admin user already exists:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Roles: ${admin.roles}`);
      
      // Update roles if needed
      if (!admin.roles || !admin.roles.includes('ADMIN')) {
        console.log('\n🔄 Updating admin roles...');
        admin = await prisma.user.update({
          where: { id: admin.id },
          data: {
            roles: 'ADMIN,ORGANIZER,PLAYER,UMPIRE'
          }
        });
        console.log('✅ Admin roles updated');
      }
    } else {
      console.log('❌ Admin user not found. Creating...\n');

      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create admin user
      admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Admin',
          phone: '0000000000',
          roles: 'ADMIN,ORGANIZER,PLAYER,UMPIRE',
          isVerified: true,
          isActive: true,
          isSuspended: false,
          city: 'System',
          state: 'System',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male'
        }
      });

      console.log('✅ Admin user created successfully:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Roles: ${admin.roles}`);
    }

    console.log('\n✅ Admin user is ready!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

ensureAdminExists();
