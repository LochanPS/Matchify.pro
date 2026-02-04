import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const users = [
  { name: 'Rajesh Kumar', email: 'rajesh.kumar@gmail.com', phone: '+919876543210' },
  { name: 'Priya Sharma', email: 'priya.sharma@gmail.com', phone: '+919876543211' },
  { name: 'Amit Patel', email: 'amit.patel@gmail.com', phone: '+919876543212' },
  { name: 'Sneha Reddy', email: 'sneha.reddy@gmail.com', phone: '+919876543213' },
  { name: 'Vikram Singh', email: 'vikram.singh@gmail.com', phone: '+919876543214' },
  { name: 'Ananya Iyer', email: 'ananya.iyer@gmail.com', phone: '+919876543215' },
  { name: 'Rahul Verma', email: 'rahul.verma@gmail.com', phone: '+919876543216' },
  { name: 'Kavya Nair', email: 'kavya.nair@gmail.com', phone: '+919876543217' },
  { name: 'Arjun Mehta', email: 'arjun.mehta@gmail.com', phone: '+919876543218' },
  { name: 'Divya Gupta', email: 'divya.gupta@gmail.com', phone: '+919876543219' },
  { name: 'Karthik Rao', email: 'karthik.rao@gmail.com', phone: '+919876543220' },
  { name: 'Pooja Desai', email: 'pooja.desai@gmail.com', phone: '+919876543221' },
  { name: 'Sanjay Joshi', email: 'sanjay.joshi@gmail.com', phone: '+919876543222' },
  { name: 'Meera Pillai', email: 'meera.pillai@gmail.com', phone: '+919876543223' },
  { name: 'Aditya Kapoor', email: 'aditya.kapoor@gmail.com', phone: '+919876543224' },
  { name: 'Riya Malhotra', email: 'riya.malhotra@gmail.com', phone: '+919876543225' },
  { name: 'Nikhil Agarwal', email: 'nikhil.agarwal@gmail.com', phone: '+919876543226' },
  { name: 'Ishita Bansal', email: 'ishita.bansal@gmail.com', phone: '+919876543227' },
  { name: 'Rohan Chopra', email: 'rohan.chopra@gmail.com', phone: '+919876543228' },
  { name: 'Tanvi Shah', email: 'tanvi.shah@gmail.com', phone: '+919876543229' },
  { name: 'Varun Bhatia', email: 'varun.bhatia@gmail.com', phone: '+919876543230' },
  { name: 'Nisha Sinha', email: 'nisha.sinha@gmail.com', phone: '+919876543231' },
  { name: 'Akash Pandey', email: 'akash.pandey@gmail.com', phone: '+919876543232' },
  { name: 'Shreya Mishra', email: 'shreya.mishra@gmail.com', phone: '+919876543233' },
  { name: 'Manish Saxena', email: 'manish.saxena@gmail.com', phone: '+919876543234' },
  { name: 'Anjali Tiwari', email: 'anjali.tiwari@gmail.com', phone: '+919876543235' },
  { name: 'Deepak Yadav', email: 'deepak.yadav@gmail.com', phone: '+919876543236' },
  { name: 'Swati Kulkarni', email: 'swati.kulkarni@gmail.com', phone: '+919876543237' },
  { name: 'Gaurav Bhatt', email: 'gaurav.bhatt@gmail.com', phone: '+919876543238' },
  { name: 'Neha Chauhan', email: 'neha.chauhan@gmail.com', phone: '+919876543239' },
  { name: 'Suresh Menon', email: 'suresh.menon@gmail.com', phone: '+919876543240' },
  { name: 'Lakshmi Krishnan', email: 'lakshmi.krishnan@gmail.com', phone: '+919876543241' }
];

async function createUsers() {
  console.log('🌱 Creating 32 users...\n');

  const password = await bcrypt.hash('password123', 10);
  let created = 0;
  let skipped = 0;

  for (const userData of users) {
    try {
      // Check if user already exists
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            { phone: userData.phone }
          ]
        }
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${userData.name} (already exists)`);
        skipped++;
        continue;
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: password,
          roles: 'PLAYER,UMPIRE',
          isVerified: true,
          isActive: true,
          country: 'India',
          city: 'Bangalore',
          state: 'Karnataka',
          gender: Math.random() > 0.5 ? 'Male' : 'Female',
          dateOfBirth: new Date(1990 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
        }
      });

      // Create player profile
      await prisma.playerProfile.create({
        data: {
          userId: user.id,
          matchifyPoints: Math.floor(Math.random() * 500),
          tournamentsPlayed: Math.floor(Math.random() * 10),
          matchesWon: Math.floor(Math.random() * 20),
          matchesLost: Math.floor(Math.random() * 15)
        }
      });

      // Create umpire profile
      await prisma.umpireProfile.create({
        data: {
          userId: user.id,
          matchesUmpired: Math.floor(Math.random() * 5)
        }
      });

      console.log(`✅ Created: ${userData.name} (${userData.email})`);
      created++;
    } catch (error) {
      console.error(`❌ Error creating ${userData.name}:`, error.message);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Created: ${created} users`);
  console.log(`   ⏭️  Skipped: ${skipped} users (already exist)`);
  console.log(`   📧 Default password for all users: password123`);
}

createUsers()
  .then(() => {
    console.log('\n✨ Done!');
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
