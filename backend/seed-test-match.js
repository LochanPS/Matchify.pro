import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTestMatch() {
  try {
    console.log('🌱 Seeding test match data...\n');

    // 1. Create or get umpire user
    console.log('1️⃣ Creating umpire user...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const umpire = await prisma.user.upsert({
      where: { email: 'umpire@test.com' },
      update: {},
      create: {
        email: 'umpire@test.com',
        password: hashedPassword,
        name: 'Test Umpire',
        role: 'UMPIRE',
        phone: '+1234567890',
        city: 'Test City',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE'
      }
    });
    console.log('   ✅ Umpire created:', umpire.email);

    // 2. Create organizer
    console.log('\n2️⃣ Creating organizer...');
    const organizer = await prisma.user.upsert({
      where: { email: 'organizer@test.com' },
      update: {},
      create: {
        email: 'organizer@test.com',
        password: hashedPassword,
        name: 'Test Organizer',
        role: 'ORGANIZER',
        phone: '+1234567891',
        city: 'Test City',
        dateOfBirth: new Date('1985-01-01'),
        gender: 'MALE'
      }
    });
    console.log('   ✅ Organizer created:', organizer.email);

    // 3. Create tournament
    console.log('\n3️⃣ Creating tournament...');
    const tournament = await prisma.tournament.create({
      data: {
        name: 'Test Tournament 2025',
        description: 'Test tournament for scoring',
        venue: 'Test Sports Complex',
        address: 'Test Sports Complex, Test City',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        zone: 'South',
        country: 'India',
        registrationOpenDate: new Date('2025-01-01'),
        registrationCloseDate: new Date('2025-01-10'),
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-17'),
        format: 'KNOCKOUT',
        privacy: 'public',
        status: 'published',
        totalCourts: 4,
        organizerId: organizer.id
      }
    });
    console.log('   ✅ Tournament created:', tournament.name);

    // 4. Create category
    console.log('\n4️⃣ Creating category...');
    const category = await prisma.category.create({
      data: {
        name: "Men's Singles",
        format: 'SINGLES',
        gender: 'MALE',
        ageGroup: 'OPEN',
        maxParticipants: 16,
        entryFee: 500,
        tournamentId: tournament.id
      }
    });
    console.log('   ✅ Category created:', category.name);

    // 5. Create test players
    console.log('\n5️⃣ Creating test players...');
    const player1 = await prisma.user.upsert({
      where: { email: 'player1@test.com' },
      update: {},
      create: {
        email: 'player1@test.com',
        password: hashedPassword,
        name: 'John Doe',
        role: 'PLAYER',
        phone: '+1234567892',
        city: 'Test City',
        dateOfBirth: new Date('1995-01-01'),
        gender: 'MALE'
      }
    });

    const player2 = await prisma.user.upsert({
      where: { email: 'player2@test.com' },
      update: {},
      create: {
        email: 'player2@test.com',
        password: hashedPassword,
        name: 'Mike Smith',
        role: 'PLAYER',
        phone: '+1234567893',
        city: 'Test City',
        dateOfBirth: new Date('1996-01-01'),
        gender: 'MALE'
      }
    });
    console.log('   ✅ Players created: John Doe, Mike Smith');

    // 6. Create registrations
    console.log('\n6️⃣ Creating registrations...');
    const reg1 = await prisma.registration.create({
      data: {
        user: { connect: { id: player1.id } },
        tournament: { connect: { id: tournament.id } },
        category: { connect: { id: category.id } },
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        amountTotal: 500
      }
    });

    const reg2 = await prisma.registration.create({
      data: {
        user: { connect: { id: player2.id } },
        tournament: { connect: { id: tournament.id } },
        category: { connect: { id: category.id } },
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        amountTotal: 500
      }
    });
    console.log('   ✅ Registrations created');

    // 7. Create match
    console.log('\n7️⃣ Creating match...');
    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        categoryId: category.id,
        round: 1,
        matchNumber: 1,
        player1Id: player1.id,
        player2Id: player2.id,
        status: 'PENDING',
        courtNumber: 1,
        umpireId: umpire.id,
        scheduledTime: new Date()
      }
    });
    console.log('   ✅ Match created');

    console.log('\n===========================================');
    console.log('✅ TEST DATA SEEDED SUCCESSFULLY!');
    console.log('===========================================\n');

    console.log('📋 LOGIN CREDENTIALS:\n');
    console.log('Umpire Account:');
    console.log('  Email: umpire@test.com');
    console.log('  Password: password123\n');
    
    console.log('Organizer Account:');
    console.log('  Email: organizer@test.com');
    console.log('  Password: password123\n');

    console.log('===========================================');
    console.log('🎾 SCORING CONSOLE URL:');
    console.log('===========================================\n');
    console.log(`http://localhost:5173/scoring/${match.id}\n`);

    console.log('===========================================');
    console.log('📝 NEXT STEPS:');
    console.log('===========================================\n');
    console.log('1. Login as umpire (umpire@test.com / password123)');
    console.log('2. Go to the scoring URL above');
    console.log('3. Click "Start Match"');
    console.log('4. Test all Day 40 features:');
    console.log('   - Match timer');
    console.log('   - Pause/Resume');
    console.log('   - Score to 20-15 for game point alert');
    console.log('   - Complete first set');
    console.log('   - Score to 20-15 in set 2 for match point alert');
    console.log('   - Complete match\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestMatch();
