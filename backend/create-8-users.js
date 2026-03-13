import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createUsers() {
  try {
    console.log('🚀 Creating 8 users...\n');

    const users = [
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@gmail.com',
        phone: '+919876543210',
        dateOfBirth: new Date('1995-03-15'),
        password: 'Player@123',
        roles: 'PLAYER',
        gender: 'MALE',
        city: 'Bangalore',
        state: 'Karnataka'
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@gmail.com',
        phone: '+919876543211',
        dateOfBirth: new Date('1998-07-22'),
        password: 'Player@123',
        roles: 'PLAYER',
        gender: 'FEMALE',
        city: 'Mumbai',
        state: 'Maharashtra'
      },
      {
        name: 'Amit Kumar',
        email: 'amit.kumar@gmail.com',
        phone: '+919876543212',
        dateOfBirth: new Date('1992-11-08'),
        password: 'Player@123',
        roles: 'PLAYER',
        gender: 'MALE',
        city: 'Delhi',
        state: 'Delhi'
      },
      {
        name: 'Sneha Reddy',
        email: 'sneha.reddy@gmail.com',
        phone: '+919876543213',
        dateOfBirth: new Date('2000-01-30'),
        password: 'Player@123',
        roles: 'PLAYER',
        gender: 'FEMALE',
        city: 'Hyderabad',
        state: 'Telangana'
      },
      {
        name: 'Vikram Singh',
        email: 'vikram.singh@gmail.com',
        phone: '+919876543214',
        dateOfBirth: new Date('1994-05-18'),
        password: 'Player@123',
        roles: 'PLAYER',
        gender: 'MALE',
        city: 'Pune',
        state: 'Maharashtra'
      },
      {
        name: 'Anjali Verma',
        email: 'anjali.verma@gmail.com',
        phone: '+919876543215',
        dateOfBirth: new Date('1997-09-25'),
        password: 'Player@123',
        roles: 'PLAYER',
        gender: 'FEMALE',
        city: 'Chennai',
        state: 'Tamil Nadu'
      },
      {
        name: 'Rohan Gupta',
        email: 'rohan.gupta@gmail.com',
        phone: '+919876543216',
        dateOfBirth: new Date('1996-12-10'),
        password: 'Player@123',
        roles: 'PLAYER',
        gender: 'MALE',
        city: 'Kolkata',
        state: 'West Bengal'
      },
      {
        name: 'Kavya Nair',
        email: 'kavya.nair@gmail.com',
        phone: '+919876543217',
        dateOfBirth: new Date('1999-04-05'),
        password: 'Player@123',
        roles: 'PLAYER',
        gender: 'FEMALE',
        city: 'Kochi',
        state: 'Kerala'
      }
    ];

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            { phone: userData.phone }
          ]
        }
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.name} already exists (${userData.email})`);
        continue;
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          dateOfBirth: userData.dateOfBirth,
          password: userData.password,
          roles: userData.roles,
          gender: userData.gender,
          city: userData.city,
          state: userData.state
        }
      });

      console.log(`✅ Created user: ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   📱 Phone: ${user.phone}`);
      console.log(`   🎂 DOB: ${user.dateOfBirth.toLocaleDateString('en-IN')}`);
      console.log(`   📍 Location: ${user.city}, ${user.state}\n`);
    }

    console.log('✨ User creation completed!\n');
    console.log('📝 Login credentials for all users:');
    console.log('   Password: Player@123\n');

  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();
