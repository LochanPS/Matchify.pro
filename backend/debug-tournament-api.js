import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugTournamentAPI() {
  try {
    console.log('🔍 Debugging Tournament API...');
    
    // Test the exact same query that the API uses
    const page = 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    
    console.log('📊 Query parameters:');
    console.log(`   Page: ${page}`);
    console.log(`   Limit: ${limit}`);
    console.log(`   Skip: ${skip}`);
    
    // This is the exact query from the API
    const tournaments = await prisma.tournament.findMany({
      where: {
        status: 'published',
        privacy: 'public'
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        posters: {
          select: {
            id: true,
            imageUrl: true,
            displayOrder: true
          },
          orderBy: {
            displayOrder: 'asc'
          }
        },
        categories: {
          select: {
            id: true,
            name: true,
            format: true,
            gender: true,
            entryFee: true,
            maxParticipants: true,
            registrationCount: true
          }
        },
        _count: {
          select: {
            categories: true,
            registrations: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    console.log(`✅ Found ${tournaments.length} tournaments`);
    
    tournaments.forEach(t => {
      console.log(`   - ${t.name}`);
      console.log(`     ID: ${t.id}`);
      console.log(`     Status: ${t.status}`);
      console.log(`     Privacy: ${t.privacy}`);
      console.log(`     Organizer: ${t.organizer.name}`);
      console.log(`     Categories: ${t.categories.length}`);
      console.log(`     Registrations: ${t._count.registrations}`);
      console.log('');
    });
    
    // Test total count
    const total = await prisma.tournament.count({
      where: {
        status: 'published',
        privacy: 'public'
      }
    });
    
    console.log(`📊 Total published public tournaments: ${total}`);
    
    // Test with no filters
    const allTournaments = await prisma.tournament.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        privacy: true
      }
    });
    
    console.log(`📊 All tournaments (no filters): ${allTournaments.length}`);
    allTournaments.forEach(t => {
      console.log(`   - ${t.name}: status=${t.status}, privacy=${t.privacy}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugTournamentAPI();