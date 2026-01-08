import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupDemoUsers() {
  console.log('👥 Setting up demo users...\n');

  const demoUsers = [
    {
      email: 'testplayer@matchify.com',
      password: 'password123',
      role: 'PLAYER',
      name: 'Test Player',
      phone: '+91 9876543210',
      city: 'Mumbai',
      state: 'Maharashtra',
      walletBalance: 1000
    },
    {
      email: 'testorganizer@matchify.com',
      password: 'password123',
      role: 'ORGANIZER',
      name: 'Test Organizer',
      phone: '+91 9876543211',
      city: 'Delhi',
      state: 'Delhi',
      walletBalance: 25
    },
    {
      email: 'umpire@test.com',
      password: 'password123',
      role: 'UMPIRE',
      name: 'Test Umpire',
      phone: '+91 9876543212',
      city: 'Bangalore',
      state: 'Karnataka',
      walletBalance: 0
    },
    {
      email: 'admin@matchify.com',
      password: 'password123',
      role: 'ADMIN',
      name: 'Admin User',
      phone: '+91 9876543213',
      city: 'Mumbai',
      state: 'Maharashtra',
      walletBalance: 0
    }
  ];

  try {
    for (const userData of demoUsers) {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        // Update existing user
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        await prisma.user.update({
          where: { email: userData.email },
          data: {
            password: hashedPassword,
            name: userData.name,
            phone: userData.phone,
            city: userData.city,
            state: userData.state,
            role: userData.role,
            walletBalance: userData.walletBalance,
            isActive: true,
            isSuspended: false
          }
        });
        console.log(`✅ Updated: ${userData.email} (${userData.role})`);
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            phone: userData.phone,
            city: userData.city,
            state: userData.state,
            role: userData.role,
            walletBalance: userData.walletBalance
          }
        });
        console.log(`✅ Created: ${userData.email} (${userData.role})`);
      }
    }

    console.log('\n✅ Demo users setup completed!');
    console.log('\n📝 Login Credentials:');
    console.log('   Player:    testplayer@matchify.com / password123');
    console.log('   Organizer: testorganizer@matchify.com / password123');
    console.log('   Umpire:    umpire@test.com / password123');
    console.log('   Admin:     admin@matchify.com / password123');

  } catch (error) {
    console.error('❌ Error setting up demo users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupDemoUsers()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
