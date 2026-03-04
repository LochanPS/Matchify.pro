import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with test users...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'player@test.com',
        password: hashedPassword,
        name: 'Test Player',
        phone: '+919876543210',
        role: 'PLAYER',
        city: 'Bangalore',
        state: 'Karnataka',
        gender: 'MALE',
        dateOfBirth: new Date('1995-05-15'),
        totalPoints: 450,
        tournamentsPlayed: 8,
        matchesWon: 15,
        matchesLost: 5,
        walletBalance: 1000
      },
    }),
    prisma.user.create({
      data: {
        email: 'organizer@test.com',
        password: hashedPassword,
        name: 'Test Organizer',
        phone: '+919876543211',
        role: 'ORGANIZER',
        city: 'Mumbai',
        state: 'Maharashtra',
        gender: 'MALE',
        walletBalance: 500
      },
    }),
    prisma.user.create({
      data: {
        email: 'umpire@test.com',
        password: hashedPassword,
        name: 'Test Umpire',
        phone: '+919876543212',
        role: 'UMPIRE',
        city: 'Delhi',
        state: 'Delhi',
        gender: 'FEMALE',
        walletBalance: 200
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@matchify.com',
        password: hashedPassword,
        name: 'Admin User',
        phone: '+919876543213',
        role: 'ADMIN',
        city: 'Bangalore',
        state: 'Karnataka',
        walletBalance: 0
      },
    }),
  ]);

  console.log('✅ Created test users:');
  users.forEach(user => {
    console.log(`   ${user.name} (${user.role}) - ${user.email}`);
  });

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });