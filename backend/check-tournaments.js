import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTournaments() {
  try {
    console.log('🔍 Checking tournament status...');
    
    const tournaments = await prisma.tournament.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        city: true,
        state: true,
        privacy: true,
        organizerId: true
      }
    });
    
    console.log(`📊 Found ${tournaments.length} tournaments in database`);
    
    tournaments.forEach(t => {
      console.log(`   - ${t.name}`);
      console.log(`     Status: ${t.status}`);
      console.log(`     Privacy: ${t.privacy}`);
      console.log(`     Location: ${t.city}, ${t.state}`);
      console.log(`     Dates: ${t.startDate} to ${t.endDate}`);
      console.log('');
    });
    
    // Check if tournaments are published and public
    const publicTournaments = tournaments.filter(t => t.privacy === 'public' && t.status === 'published');
    console.log(`🌐 Public published tournaments: ${publicTournaments.length}`);
    
    if (publicTournaments.length === 0) {
      console.log('❌ No public published tournaments found!');
      console.log('🔧 Fixing tournament visibility...');
      
      // Update tournaments to be public and published
      const updateResult = await prisma.tournament.updateMany({
        data: {
          privacy: 'public',
          status: 'published'
        }
      });
      
      console.log(`✅ Updated ${updateResult.count} tournaments to be public and published`);
      
      // Verify the fix
      const updatedTournaments = await prisma.tournament.findMany({
        where: {
          privacy: 'public',
          status: 'published'
        },
        select: {
          id: true,
          name: true,
          status: true,
          privacy: true
        }
      });
      
      console.log(`✅ Now showing ${updatedTournaments.length} public tournaments`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTournaments();