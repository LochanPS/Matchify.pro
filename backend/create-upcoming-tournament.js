import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createUpcomingTournament() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'testorganizer@matchify.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    // Create a tournament starting in 15 days (within 30-day window)
    const tournament = await prisma.tournament.create({
      data: {
        organizerId: user.id,
        name: 'Delhi Badminton Open 2026',
        description: 'Premier badminton tournament in Delhi. All categories welcome!',
        venue: 'Delhi Sports Arena',
        address: '456 Tournament Lane, Connaught Place',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        zone: 'North',
        country: 'India',
        format: 'both',
        privacy: 'public',
        status: 'published',
        registrationOpenDate: new Date(),
        registrationCloseDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
        startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days (within 30-day window)
        endDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000), // 17 days
      }
    });

    console.log('✅ Upcoming tournament created:', tournament.name);
    console.log('   Starts in 15 days - will show in dashboard!');

    // Create categories
    await prisma.category.create({
      data: {
        tournamentId: tournament.id,
        name: "Men's Singles",
        format: 'singles',
        gender: 'men',
        entryFee: 600,
        maxParticipants: 32,
        scoringFormat: '21x3'
      }
    });

    console.log('✅ Category created');
    console.log('\n✅ Now refresh the dashboard!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUpcomingTournament();
