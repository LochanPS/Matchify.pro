import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTournaments() {
  try {
    console.log('🌱 Seeding tournaments...\n');

    // Get an organizer
    const organizer = await prisma.user.findFirst({
      where: { role: 'ORGANIZER' },
    });

    if (!organizer) {
      console.log('❌ No organizer found. Please run test-auth.js first to create test users.');
      return;
    }

    console.log(`✅ Found organizer: ${organizer.name}\n`);

    // Define tournament data
    const cities = [
      { name: 'Bangalore', state: 'Karnataka', zone: 'South' },
      { name: 'Mumbai', state: 'Maharashtra', zone: 'West' },
      { name: 'Delhi', state: 'Delhi', zone: 'North' },
      { name: 'Hyderabad', state: 'Telangana', zone: 'South' },
      { name: 'Chennai', state: 'Tamil Nadu', zone: 'South' },
      { name: 'Pune', state: 'Maharashtra', zone: 'West' },
      { name: 'Kolkata', state: 'West Bengal', zone: 'East' },
      { name: 'Ahmedabad', state: 'Gujarat', zone: 'West' },
    ];

    const formats = ['singles', 'doubles', 'both'];
    const statuses = ['published', 'published', 'published', 'ongoing', 'draft'];

    const tournaments = [];

    for (let i = 0; i < 30; i++) {
      const city = cities[i % cities.length];
      const format = formats[i % formats.length];
      const status = statuses[i % statuses.length];

      // Random dates in the future
      const daysFromNow = Math.floor(Math.random() * 90) + 10; // 10-100 days from now
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + daysFromNow);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 2); // 2-day tournament

      const registrationOpenDate = new Date();
      registrationOpenDate.setDate(registrationOpenDate.getDate() - 5); // Opened 5 days ago

      const registrationCloseDate = new Date(startDate);
      registrationCloseDate.setDate(registrationCloseDate.getDate() - 3); // Closes 3 days before

      tournaments.push({
        name: `${city.name} ${format === 'both' ? 'Open' : format.charAt(0).toUpperCase() + format.slice(1)} Badminton Championship ${i + 1}`,
        description: `Join us for an exciting badminton tournament in ${city.name}! This ${format} tournament welcomes players of all skill levels. Great prizes and competitive matches await!`,
        venue: `${city.name} Sports Complex`,
        address: `${i + 1} Stadium Road, ${city.name}`,
        city: city.name,
        state: city.state,
        pincode: `${560000 + i}`,
        zone: city.zone,
        country: 'India',
        format,
        privacy: 'public',
        status,
        registrationOpenDate,
        registrationCloseDate,
        startDate,
        endDate,
        totalCourts: Math.floor(Math.random() * 6) + 4, // 4-10 courts
        matchStartTime: '08:00',
        matchEndTime: '18:00',
        matchDuration: 60,
        organizerId: organizer.id,
      });
    }

    // Create tournaments
    console.log('Creating tournaments...');
    const createdTournaments = await prisma.tournament.createMany({
      data: tournaments,
    });

    console.log(`✅ Created ${createdTournaments.count} tournaments\n`);

    // Get all created tournaments to add categories
    const allTournaments = await prisma.tournament.findMany({
      where: { organizerId: organizer.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    console.log('Adding categories to tournaments...');

    // Add categories to each tournament
    for (const tournament of allTournaments) {
      const categories = [];

      if (tournament.format === 'singles' || tournament.format === 'both') {
        categories.push(
          {
            tournamentId: tournament.id,
            name: "Men's Singles Open",
            format: 'singles',
            gender: 'men',
            ageGroup: 'Open',
            entryFee: 500,
            maxParticipants: 32,
            scoringFormat: 'best_of_3',
          },
          {
            tournamentId: tournament.id,
            name: "Women's Singles Open",
            format: 'singles',
            gender: 'women',
            ageGroup: 'Open',
            entryFee: 500,
            maxParticipants: 32,
            scoringFormat: 'best_of_3',
          }
        );
      }

      if (tournament.format === 'doubles' || tournament.format === 'both') {
        categories.push(
          {
            tournamentId: tournament.id,
            name: "Men's Doubles Open",
            format: 'doubles',
            gender: 'men',
            ageGroup: 'Open',
            entryFee: 600,
            maxParticipants: 16,
            scoringFormat: 'best_of_3',
          },
          {
            tournamentId: tournament.id,
            name: "Women's Doubles Open",
            format: 'doubles',
            gender: 'women',
            ageGroup: 'Open',
            entryFee: 600,
            maxParticipants: 16,
            scoringFormat: 'best_of_3',
          },
          {
            tournamentId: tournament.id,
            name: 'Mixed Doubles Open',
            format: 'doubles',
            gender: 'mixed',
            ageGroup: 'Open',
            entryFee: 700,
            maxParticipants: 16,
            scoringFormat: 'best_of_3',
          }
        );
      }

      await prisma.category.createMany({
        data: categories,
      });
    }

    console.log(`✅ Added categories to all tournaments\n`);

    // Summary
    const summary = await prisma.tournament.groupBy({
      by: ['status', 'format'],
      _count: true,
    });

    console.log('📊 Tournament Summary:');
    console.log('='.repeat(50));
    summary.forEach(item => {
      console.log(`${item.status.padEnd(15)} ${item.format.padEnd(10)} ${item._count} tournaments`);
    });

    console.log('\n✅ Seeding complete!\n');

  } catch (error) {
    console.error('❌ Error seeding tournaments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTournaments();
