import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUser() {
  try {
    // Check by phone
    const userByPhone = await prisma.user.findUnique({
      where: { phone: '+918008418180' }
    });
    
    if (userByPhone) {
      console.log('Found user with phone +918008418180:');
      console.log('  Email:', userByPhone.email);
      console.log('  Name:', userByPhone.name);
      console.log('  Roles:', userByPhone.roles);
    }

    // Also check without +91
    const userByPhone2 = await prisma.user.findUnique({
      where: { phone: '8008418180' }
    });
    
    if (userByPhone2) {
      console.log('Found user with phone 8008418180:');
      console.log('  Email:', userByPhone2.email);
      console.log('  Name:', userByPhone2.name);
      console.log('  Roles:', userByPhone2.roles);
    }

    // Check by email
    const userByEmail = await prisma.user.findUnique({
      where: { email: 'pokkalipradyumna@gmail.com' }
    });
    
    if (userByEmail) {
      console.log('Found user with email pokkalipradyumna@gmail.com:');
      console.log('  Phone:', userByEmail.phone);
      console.log('  Name:', userByEmail.name);
      console.log('  Roles:', userByEmail.roles);
    }

    if (!userByPhone && !userByPhone2 && !userByEmail) {
      console.log('No user found with that phone or email');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();