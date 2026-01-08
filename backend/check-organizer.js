import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrganizer() {
  try {
    // Get testorganizer user
    const user = await prisma.user.findUnique({
      where: { email: 'testorganizer@matchify.com' },
      select: { id: true, name: true, email: true, role: true, walletBalance: true }
    });

    console.log('User:', user);

    if (user) {
      // Count tournaments
      const tournamentCount = await prisma.tournament.count({
        where: { organizerId: user.id }
      });

      console.log('Tournaments created by this organizer:', tournamentCount);

      // Get all tournaments (first 5)
      const allTournaments = await prisma.tournament.findMany({
        take: 5,
        select: {
          id: true,
          name: true,
          organizerId: true,
          organizer: {
            select: { name: true, email: true }
          }
        }
      });

      console.log('\nSample tournaments in database:');
      allTournaments.forEach(t => {
        console.log(`- ${t.name} (by ${t.organizer.email})`);
      });

      // Total tournaments in database
      const totalTournaments = await prisma.tournament.count();
      console.log(`\nTotal tournaments in database: ${totalTournaments}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrganizer();
