import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];
const STATES = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Maharashtra', 'Gujarat'];
const ZONES = ['West', 'North', 'South', 'South', 'South', 'East', 'West', 'West'];

async function seedTournaments() {
  // Get an organizer user
  const organizer = await prisma.user.findFirst({
    where: { role: 'ORGANIZER' }
  });

  if (!organizer) {
    console.log('❌ Please create an organizer user first!');
    console.log('Run: npm run seed (to create test users)');
    return;
  }

  console.log(`✅ Found organizer: ${organizer.name}`);
  console.log('🌱 Starting to seed tournaments...\n');

  // Create 50 tournaments
  for (let i = 1; i <= 50; i++) {
    const cityIndex = Math.floor(Math.random() * CITIES.length);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 90)); // Next 90 days
    
    const regCloseDate = new Date(startDate);
    regCloseDate.setDate(regCloseDate.getDate() - 5); // Close 5 days before
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2); // 2-day tournament
    
    const formats = ['singles', 'doubles', 'both'];
    const statuses = ['published', 'published', 'published', 'ongoing', 'completed']; // More published ones
    
    const tournament = await prisma.tournament.create({
      data: {
        name: `${CITIES[cityIndex]} Open Championship ${i}`,
        description: `A premier badminton tournament in ${CITIES[cityIndex]}. Join us for exciting matches and compete with the best players!`,
        organizerId: organizer.id,
        city: CITIES[cityIndex],
        state: STATES[cityIndex],
        zone: ZONES[cityIndex],
        country: 'India',
        venue: `${CITIES[cityIndex]} Sports Complex`,
        address: `Sector ${i}, ${CITIES[cityIndex]}, ${STATES[cityIndex]}`,
        pincode: `${400000 + i}`,
        startDate: startDate,
        endDate: endDate,
        registrationOpenDate: new Date(),
        registrationCloseDate: regCloseDate,
        format: formats[Math.floor(Math.random() * formats.length)],
        privacy: 'public',
        status: statuses[Math.floor(Math.random() * statuses.length)].toLowerCase(),
      }
    });

    // Add 2-3 categories per tournament
    const categories = [
      { name: 'Men\'s Singles Open', format: 'singles', gender: 'men', ageGroup: 'Open', entryFee: 500 },
      { name: 'Women\'s Singles Open', format: 'singles', gender: 'women', ageGroup: 'Open', entryFee: 500 },
      { name: 'Men\'s Doubles Open', format: 'doubles', gender: 'men', ageGroup: 'Open', entryFee: 800 },
    ];

    for (const cat of categories) {
      await prisma.category.create({
        data: {
          ...cat,
          tournamentId: tournament.id
        }
      });
    }

    console.log(`✅ Created tournament ${i}/50: ${tournament.name}`);
  }

  console.log('\n🎉 Seeding complete! 50 tournaments created.');
}

seedTournaments()
  .catch((e) => {
    console.error('❌ Error seeding tournaments:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
