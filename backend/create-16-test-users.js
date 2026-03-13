import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const testUsers = [
  // 8 Boys
  {
    name: 'Arjun Sharma',
    email: 'arjun.sharma@gmail.com',
    phone: '+919876543210',
    password: 'Player@123',
    gender: 'Male',
    dateOfBirth: new Date('1998-03-15'),
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India'
  },
  {
    name: 'Rahul Verma',
    email: 'rahul.verma@gmail.com',
    phone: '+919876543211',
    password: 'Player@123',
    gender: 'Male',
    dateOfBirth: new Date('1999-07-22'),
    city: 'Delhi',
    state: 'Delhi',
    country: 'India'
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@gmail.com',
    phone: '+919876543212',
    password: 'Player@123',
    gender: 'Male',
    dateOfBirth: new Date('1997-11-08'),
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India'
  },
  {
    name: 'Aditya Patel',
    email: 'aditya.patel@gmail.com',
    phone: '+919876543213',
    password: 'Player@123',
    gender: 'Male',
    dateOfBirth: new Date('2000-01-30'),
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India'
  },
  {
    name: 'Rohan Gupta',
    email: 'rohan.gupta@gmail.com',
    phone: '+919876543214',
    password: 'Player@123',
    gender: 'Male',
    dateOfBirth: new Date('1998-09-12'),
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India'
  },
  {
    name: 'Karan Reddy',
    email: 'karan.reddy@gmail.com',
    phone: '+919876543215',
    password: 'Player@123',
    gender: 'Male',
    dateOfBirth: new Date('1999-05-18'),
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India'
  },
  {
    name: 'Siddharth Kumar',
    email: 'siddharth.kumar@gmail.com',
    phone: '+919876543216',
    password: 'Player@123',
    gender: 'Male',
    dateOfBirth: new Date('1997-12-25'),
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India'
  },
  {
    name: 'Aman Joshi',
    email: 'aman.joshi@gmail.com',
    phone: '+919876543217',
    password: 'Player@123',
    gender: 'Male',
    dateOfBirth: new Date('2000-04-07'),
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India'
  },
  
  // 8 Girls
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    phone: '+919876543218',
    password: 'Player@123',
    gender: 'Female',
    dateOfBirth: new Date('1998-06-14'),
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India'
  },
  {
    name: 'Ananya Singh',
    email: 'ananya.singh@gmail.com',
    phone: '+919876543219',
    password: 'Player@123',
    gender: 'Female',
    dateOfBirth: new Date('1999-02-20'),
    city: 'Delhi',
    state: 'Delhi',
    country: 'India'
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reddy@gmail.com',
    phone: '+919876543220',
    password: 'Player@123',
    gender: 'Female',
    dateOfBirth: new Date('1997-08-16'),
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India'
  },
  {
    name: 'Ishita Patel',
    email: 'ishita.patel@gmail.com',
    phone: '+919876543221',
    password: 'Player@123',
    gender: 'Female',
    dateOfBirth: new Date('2000-10-03'),
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India'
  },
  {
    name: 'Kavya Gupta',
    email: 'kavya.gupta@gmail.com',
    phone: '+919876543222',
    password: 'Player@123',
    gender: 'Female',
    dateOfBirth: new Date('1998-12-28'),
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India'
  },
  {
    name: 'Riya Verma',
    email: 'riya.verma@gmail.com',
    phone: '+919876543223',
    password: 'Player@123',
    gender: 'Female',
    dateOfBirth: new Date('1999-04-11'),
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India'
  },
  {
    name: 'Diya Kumar',
    email: 'diya.kumar@gmail.com',
    phone: '+919876543224',
    password: 'Player@123',
    gender: 'Female',
    dateOfBirth: new Date('1997-09-05'),
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India'
  },
  {
    name: 'Aisha Joshi',
    email: 'aisha.joshi@gmail.com',
    phone: '+919876543225',
    password: 'Player@123',
    gender: 'Female',
    dateOfBirth: new Date('2000-07-19'),
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India'
  }
];

async function createTestUsers() {
  console.log('🎾 Creating 16 test users (8 boys + 8 girls)...\n');

  let created = 0;
  let skipped = 0;

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${userData.name} (${userData.email}) - already exists`);
        skipped++;
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          roles: 'PLAYER',
          isActive: true,
          isVerified: true,
          walletBalance: 0,
          totalPoints: 0,
          tournamentsPlayed: 0,
          matchesWon: 0,
          matchesLost: 0
        }
      });

      console.log(`✅ Created: ${user.name} (${user.email}) - ${user.gender} from ${user.city}, ${user.state}`);
      created++;

    } catch (error) {
      console.error(`❌ Error creating ${userData.name}:`, error.message);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Created: ${created} users`);
  console.log(`   ⏭️  Skipped: ${skipped} users (already exist)`);
  console.log(`   📝 Total: ${testUsers.length} users processed`);
  console.log('\n🔑 Login credentials for all users:');
  console.log('   Password: Player@123');
  console.log('\n👥 User List:');
  console.log('\n   BOYS:');
  testUsers.slice(0, 8).forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.name} - ${u.email} - ${u.city}, ${u.state}`);
  });
  console.log('\n   GIRLS:');
  testUsers.slice(8, 16).forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.name} - ${u.email} - ${u.city}, ${u.state}`);
  });

  await prisma.$disconnect();
}

createTestUsers()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
