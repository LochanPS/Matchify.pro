const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create 5 users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'player1@test.com',
        password: hashedPassword,
        name: 'Rajesh Kumar',
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
      },
    }),
    prisma.user.create({
      data: {
        email: 'player2@test.com',
        password: hashedPassword,
        name: 'Priya Sharma',
        phone: '+919876543211',
        role: 'PLAYER',
        city: 'Mumbai',
        state: 'Maharashtra',
        gender: 'FEMALE',
        dateOfBirth: new Date('1998-08-20'),
        totalPoints: 320,
        tournamentsPlayed: 5,
        matchesWon: 10,
        matchesLost: 4,
      },
    }),
    prisma.user.create({
      data: {
        email: 'organizer1@test.com',
        password: hashedPassword,
        name: 'Amit Patel',
        phone: '+919876543212',
        role: 'ORGANIZER',
        city: 'Delhi',
        state: 'Delhi',
        gender: 'MALE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'umpire1@test.com',
        password: hashedPassword,
        name: 'Suresh Reddy',
        phone: '+919876543213',
        role: 'UMPIRE',
        city: 'Hyderabad',
        state: 'Telangana',
        gender: 'MALE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@matchify.pro',
        password: hashedPassword,
        name: 'Admin User',
        phone: '+919876543214',
        role: 'ADMIN',
        city: 'Bangalore',
        state: 'Karnataka',
      },
    }),
  ]);

  console.log('✅ Created 5 users');

  // Create 2 tournaments
  const tournament1 = await prisma.tournament.create({
    data: {
      organizerId: users[2].id, // Amit Patel (organizer)
      name: 'Bangalore Open Badminton Championship 2025',
      description: 'Premier badminton tournament in Bangalore',
      venue: 'Kanteerava Indoor Stadium',
      address: 'Kasturba Road, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      zone: 'South',
      startDate: new Date('2025-02-15'),
      endDate: new Date('2025-02-18'),
      registrationOpen: new Date('2025-01-01'),
      registrationClose: new Date('2025-02-10'),
      status: 'PUBLISHED',
      totalCourts: 8,
      matchStartTime: '08:00',
      matchEndTime: '18:00',
    },
  });

  const tournament2 = await prisma.tournament.create({
    data: {
      organizerId: users[2].id,
      name: 'Mumbai Masters 2025',
      description: 'Competitive badminton tournament',
      venue: 'NSCI Sports Complex',
      address: 'Worli, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      zone: 'West',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-03-03'),
      registrationOpen: new Date('2025-01-15'),
      registrationClose: new Date('2025-02-25'),
      status: 'REGISTRATION_OPEN',
      totalCourts: 6,
      matchStartTime: '09:00',
      matchEndTime: '17:00',
    },
  });

  console.log('✅ Created 2 tournaments');

  // Add categories to tournament 1
  await prisma.category.createMany({
    data: [
      {
        tournamentId: tournament1.id,
        name: "Men's Singles Open",
        format: 'SINGLES',
        gender: 'MALE',
        ageGroup: 'Open',
        entryFee: 500,
        maxEntries: 32,
      },
      {
        tournamentId: tournament1.id,
        name: "Women's Singles Open",
        format: 'SINGLES',
        gender: 'FEMALE',
        ageGroup: 'Open',
        entryFee: 500,
        maxEntries: 16,
      },
      {
        tournamentId: tournament1.id,
        name: "Men's Doubles Open",
        format: 'DOUBLES',
        gender: 'MALE',
        ageGroup: 'Open',
        entryFee: 800,
        maxEntries: 16,
      },
    ],
  });

  console.log('✅ Created categories');

  // Add wallet transactions
  await prisma.walletTransaction.createMany({
    data: [
      {
        userId: users[0].id,
        type: 'TOPUP',
        amount: 1000,
        balanceBefore: 0,
        balanceAfter: 1000,
        description: 'Wallet top-up via Razorpay',
        razorpayOrderId: 'order_test123',
        razorpayPaymentId: 'pay_test123',
      },
      {
        userId: users[1].id,
        type: 'TOPUP',
        amount: 2000,
        balanceBefore: 0,
        balanceAfter: 2000,
        description: 'Wallet top-up via Razorpay',
        razorpayOrderId: 'order_test456',
        razorpayPaymentId: 'pay_test456',
      },
    ],
  });

  // Update user wallet balances
  await prisma.user.update({
    where: { id: users[0].id },
    data: { walletBalance: 1000 },
  });

  await prisma.user.update({
    where: { id: users[1].id },
    data: { walletBalance: 2000 },
  });

  console.log('✅ Created wallet transactions');

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