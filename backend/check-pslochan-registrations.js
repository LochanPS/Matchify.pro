import prisma from './src/lib/prisma.js';

async function checkRegistrations() {
  try {
    console.log('🔍 Checking P S LOCHAN registrations...\n');

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: 'pslochan2006@gmail.com' },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user);
    console.log('');

    // Get all registrations
    const registrations = await prisma.registration.findMany({
      where: { userId: user.id },
      include: {
        category: {
          select: { name: true, format: true }
        },
        tournament: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📋 Found ${registrations.length} registrations:\n`);

    registrations.forEach((reg, index) => {
      console.log(`${index + 1}. ${reg.category.name} (${reg.category.format})`);
      console.log(`   Tournament: ${reg.tournament.name}`);
      console.log(`   Status: ${reg.status}`);
      console.log(`   Payment Status: ${reg.paymentStatus}`);
      console.log(`   Created: ${reg.createdAt}`);
      console.log(`   ID: ${reg.id}`);
      console.log('');
    });

    // Check specifically for mens and d 18
    const mensReg = registrations.find(r => r.category.name.toLowerCase().includes('men'));
    const d18Reg = registrations.find(r => r.category.name.toLowerCase().includes('d 18'));

    console.log('🎯 Specific Categories:');
    console.log('');
    
    if (mensReg) {
      console.log('👔 MENS Category:');
      console.log(`   Status: ${mensReg.status}`);
      console.log(`   Can re-register: ${mensReg.status === 'rejected' || mensReg.status === 'cancelled' ? 'YES ✅' : 'NO ❌'}`);
    } else {
      console.log('👔 MENS Category: Not found');
    }
    console.log('');

    if (d18Reg) {
      console.log('🏸 D 18 Category:');
      console.log(`   Status: ${d18Reg.status}`);
      console.log(`   Can re-register: ${d18Reg.status === 'rejected' || d18Reg.status === 'cancelled' ? 'YES ✅' : 'NO ❌'}`);
    } else {
      console.log('🏸 D 18 Category: Not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRegistrations();
