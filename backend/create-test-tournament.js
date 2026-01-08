import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestTournament() {
  try {
    // Get testorganizer user
    const user = await prisma.user.findUnique({
      where: { email: 'testorganizer@matchify.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('Creating test tournament for:', user.name);

    // Create a tournament
    const tournament = await prisma.tournament.create({
      data: {
        organizerId: user.id,
        name: 'Mumbai Badminton Championship 2026',
        description: 'Annual badminton championship in Mumbai. Open to all skill levels. Join us for an exciting tournament with great prizes!',
        venue: 'Mumbai Sports Complex',
        address: '123 Sports Road, Andheri',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        zone: 'West',
        country: 'India',
        format: 'both',
        privacy: 'public',
        status: 'published',
        registrationOpenDate: new Date(),
        registrationCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        endDate: new Date(Date.now() + 47 * 24 * 60 * 60 * 1000), // 47 days from now
      }
    });

    console.log('✅ Tournament created:', tournament.name);
    console.log('   ID:', tournament.id);
    console.log('   Status:', tournament.status);

    // Create some categories
    const categories = [
      {
        tournamentId: tournament.id,
        name: "Men's Singles",
        format: 'singles',
        gender: 'men',
        entryFee: 500,
        maxParticipants: 32,
        scoringFormat: '21x3'
      },
      {
        tournamentId: tournament.id,
        name: "Women's Singles",
        format: 'singles',
        gender: 'women',
        entryFee: 500,
        maxParticipants: 32,
        scoringFormat: '21x3'
      },
      {
        tournamentId: tournament.id,
        name: "Men's Doubles",
        format: 'doubles',
        gender: 'men',
        entryFee: 800,
        maxParticipants: 16,
        scoringFormat: '21x3'
      }
    ];

    for (const cat of categories) {
      await prisma.category.create({ data: cat });
      console.log('✅ Category created:', cat.name);
    }

    console.log('\n✅ Test tournament setup complete!');
    console.log('   Now refresh the organizer dashboard to see the data.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestTournament();
