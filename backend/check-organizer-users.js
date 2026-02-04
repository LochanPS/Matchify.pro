import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrganizers() {
  try {
    const organizers = await prisma.user.findMany({
      where: {
        roles: {
          contains: 'ORGANIZER'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        roles: true
      }
    });

    console.log('\n📋 ORGANIZER USERS:');
    console.log('='.repeat(60));
    
    if (organizers.length === 0) {
      console.log('❌ No organizer users found in database');
      console.log('\n💡 You need to add ORGANIZER role to a user first.');
      console.log('   Run: node scripts/add-organizer-role-to-admin.js');
    } else {
      console.log(`✅ Found ${organizers.length} organizer(s):\n`);
      organizers.forEach((org, index) => {
        console.log(`${index + 1}. ${org.name}`);
        console.log(`   Email: ${org.email}`);
        console.log(`   Phone: ${org.phone}`);
        console.log(`   Roles: ${org.roles}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrganizers();
