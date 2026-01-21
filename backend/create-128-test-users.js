import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Indian cities and states for realistic data
const locations = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Surat', state: 'Gujarat' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Kanpur', state: 'Uttar Pradesh' },
  { city: 'Nagpur', state: 'Maharashtra' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Thane', state: 'Maharashtra' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { city: 'Pimpri', state: 'Maharashtra' },
  { city: 'Patna', state: 'Bihar' },
  { city: 'Vadodara', state: 'Gujarat' },
  { city: 'Ghaziabad', state: 'Uttar Pradesh' },
  { city: 'Ludhiana', state: 'Punjab' },
  { city: 'Agra', state: 'Uttar Pradesh' },
  { city: 'Nashik', state: 'Maharashtra' },
  { city: 'Faridabad', state: 'Haryana' },
  { city: 'Meerut', state: 'Uttar Pradesh' },
  { city: 'Rajkot', state: 'Gujarat' },
  { city: 'Kalyan', state: 'Maharashtra' },
  { city: 'Vasai', state: 'Maharashtra' },
  { city: 'Varanasi', state: 'Uttar Pradesh' },
  { city: 'Srinagar', state: 'Jammu and Kashmir' },
  { city: 'Aurangabad', state: 'Maharashtra' },
  { city: 'Dhanbad', state: 'Jharkhand' },
  { city: 'Amritsar', state: 'Punjab' },
  { city: 'Navi Mumbai', state: 'Maharashtra' },
  { city: 'Allahabad', state: 'Uttar Pradesh' },
  { city: 'Ranchi', state: 'Jharkhand' },
  { city: 'Howrah', state: 'West Bengal' },
  { city: 'Coimbatore', state: 'Tamil Nadu' },
  { city: 'Jabalpur', state: 'Madhya Pradesh' }
];

// Common Indian first names
const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Rishabh', 'Aryan', 'Kabir', 'Ansh', 'Kian', 'Rudra',
  'Aadhya', 'Ananya', 'Diya', 'Aanya', 'Sara', 'Ira', 'Pihu', 'Prisha', 'Anaya', 'Riya',
  'Myra', 'Anika', 'Saanvi', 'Kavya', 'Khushi', 'Avni', 'Pari', 'Aarohi', 'Tara', 'Kiara',
  'Rahul', 'Rohit', 'Amit', 'Suresh', 'Rajesh', 'Vikash', 'Manoj', 'Santosh', 'Deepak', 'Ravi',
  'Priya', 'Pooja', 'Neha', 'Sunita', 'Kavita', 'Rekha', 'Geeta', 'Sita', 'Rita', 'Meera',
  'Arjun', 'Karan', 'Varun', 'Tarun', 'Arun', 'Nitin', 'Sachin', 'Rohan', 'Sohan', 'Mohan',
  'Shreya', 'Divya', 'Shweta', 'Swati', 'Smita', 'Nisha', 'Usha', 'Asha', 'Radha', 'Sudha'
];

// Common Indian last names
const lastNames = [
  'Sharma', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Agarwal', 'Jain', 'Bansal', 'Goel', 'Mittal',
  'Patel', 'Shah', 'Mehta', 'Desai', 'Modi', 'Joshi', 'Pandya', 'Trivedi', 'Vyas', 'Dave',
  'Reddy', 'Rao', 'Naidu', 'Chowdary', 'Raju', 'Krishna', 'Prasad', 'Murthy', 'Sastry', 'Varma',
  'Iyer', 'Nair', 'Menon', 'Pillai', 'Kumar', 'Raman', 'Krishnan', 'Subramanian', 'Venkatesh', 'Srinivas',
  'Khan', 'Ahmed', 'Ali', 'Hussain', 'Rahman', 'Malik', 'Sheikh', 'Ansari', 'Qureshi', 'Siddiqui',
  'Das', 'Roy', 'Ghosh', 'Mukherjee', 'Chakraborty', 'Banerjee', 'Sengupta', 'Bhattacharya', 'Dutta', 'Bose'
];

// Role distribution
const roles = ['PLAYER', 'ORGANIZER', 'UMPIRE'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generatePhoneNumber() {
  const prefixes = ['98', '97', '96', '95', '94', '93', '92', '91', '90', '89', '88', '87', '86', '85', '84', '83', '82', '81', '80', '79', '78', '77', '76', '75', '74', '73', '72', '70'];
  const prefix = getRandomElement(prefixes);
  const remaining = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${prefix}${remaining}`;
}

function generateEmail(firstName, lastName, index) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com'];
  const domain = getRandomElement(domains);
  const emailPrefix = `${firstName.toLowerCase()}${lastName.toLowerCase()}${index}`;
  return `${emailPrefix}@${domain}`;
}

async function create128TestUsers() {
  try {
    console.log('🚀 Starting to create 128 test users...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = [];
    
    for (let i = 1; i <= 128; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const location = getRandomElement(locations);
      const role = getRandomElement(roles);
      
      const user = {
        name: `${firstName} ${lastName}`,
        email: generateEmail(firstName, lastName, i),
        password: hashedPassword,
        phone: generatePhoneNumber(),
        city: location.city,
        state: location.state,
        country: 'India',
        roles: role, // Single role as string
        isActive: Math.random() > 0.1, // 90% active, 10% inactive
        isVerified: Math.random() > 0.2, // 80% verified
        isSuspended: Math.random() > 0.95, // 5% suspended
        gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
        dateOfBirth: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        totalPoints: Math.floor(Math.random() * 1000),
        tournamentsPlayed: Math.floor(Math.random() * 50),
        matchesWon: Math.floor(Math.random() * 100),
        matchesLost: Math.floor(Math.random() * 80),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)), // Random date in last year
      };
      
      users.push(user);
      
      if (i % 10 === 0) {
        console.log(`📝 Prepared ${i}/128 users...`);
      }
    }
    
    console.log('💾 Inserting users into database...');
    
    // Insert users in batches to avoid memory issues
    const batchSize = 20;
    let inserted = 0;
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      try {
        await prisma.user.createMany({
          data: batch,
          skipDuplicates: true
        });
        
        inserted += batch.length;
        console.log(`✅ Inserted batch ${Math.ceil((i + 1) / batchSize)}: ${inserted}/128 users`);
      } catch (error) {
        console.error(`❌ Error inserting batch ${Math.ceil((i + 1) / batchSize)}:`, error.message);
        // Continue with next batch
      }
    }
    
    console.log('🎉 Test user creation completed!');
    
    // Verify the total count
    const totalUsers = await prisma.user.count();
    console.log(`📊 Total users in database: ${totalUsers}`);
    
    // Show role distribution
    const roleStats = await prisma.user.groupBy({
      by: ['roles'],
      _count: {
        id: true
      }
    });
    
    console.log('📈 Role distribution:');
    roleStats.forEach(stat => {
      console.log(`  - ${stat.roles}: ${stat._count.id} users`);
    });
    
    // Show status distribution
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const suspendedUsers = await prisma.user.count({ where: { isSuspended: true } });
    const verifiedUsers = await prisma.user.count({ where: { isVerified: true } });
    
    console.log('📊 Status distribution:');
    console.log(`  - Active: ${activeUsers} users`);
    console.log(`  - Suspended: ${suspendedUsers} users`);
    console.log(`  - Verified: ${verifiedUsers} users`);
    
    console.log('✅ 128 test users created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

create128TestUsers();