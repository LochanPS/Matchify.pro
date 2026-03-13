import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Indian first names
const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Arnav', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Reyansh', 'Aadhya', 'Ananya', 'Pari', 'Anika', 'Ira',
  'Diya', 'Navya', 'Kiara', 'Saanvi', 'Myra', 'Sara', 'Aarohi', 'Avni', 'Riya', 'Anvi',
  'Rohan', 'Kabir', 'Dhruv', 'Karan', 'Yash', 'Harsh', 'Dev', 'Aryan', 'Vedant', 'Shivansh',
  'Priya', 'Neha', 'Pooja', 'Sneha', 'Anjali', 'Kavya', 'Ishita', 'Tanvi', 'Riya', 'Shreya',
  'Rahul', 'Amit', 'Raj', 'Vikram', 'Nikhil', 'Siddharth', 'Varun', 'Kunal', 'Manish', 'Gaurav',
  'Divya', 'Nisha', 'Swati', 'Megha', 'Preeti', 'Simran', 'Ritika', 'Sakshi', 'Pallavi', 'Komal',
  'Akash', 'Deepak', 'Vishal', 'Suresh', 'Ramesh', 'Mahesh', 'Rajesh', 'Dinesh', 'Mukesh', 'Hitesh',
  'Lakshmi', 'Radha', 'Sita', 'Gita', 'Meera', 'Kamala', 'Savita', 'Sunita', 'Geeta', 'Seema',
  'Arun', 'Tarun', 'Karthik', 'Praveen', 'Naveen', 'Sandeep', 'Ravi', 'Sunil', 'Anil', 'Manoj',
  'Sonal', 'Payal', 'Jyoti', 'Rekha', 'Asha', 'Usha', 'Lata', 'Mala', 'Kala', 'Hema',
  'Ajay', 'Vijay', 'Sanjay', 'Pankaj', 'Neeraj', 'Alok', 'Ashok', 'Vinod', 'Pramod', 'Subhash',
  'Madhuri', 'Shilpa', 'Kajal', 'Juhi', 'Sonali', 'Manisha', 'Raveena', 'Karishma', 'Bipasha', 'Kareena'
];

// Indian last names
const lastNames = [
  'Sharma', 'Verma', 'Kumar', 'Singh', 'Patel', 'Gupta', 'Reddy', 'Rao', 'Nair', 'Iyer',
  'Joshi', 'Mehta', 'Desai', 'Shah', 'Agarwal', 'Bansal', 'Malhotra', 'Kapoor', 'Chopra', 'Khanna',
  'Pandey', 'Mishra', 'Tiwari', 'Dubey', 'Shukla', 'Jain', 'Agrawal', 'Saxena', 'Srivastava', 'Trivedi',
  'Yadav', 'Chauhan', 'Rajput', 'Thakur', 'Rathore', 'Bhatia', 'Sethi', 'Arora', 'Sood', 'Anand',
  'Menon', 'Pillai', 'Krishnan', 'Narayanan', 'Subramanian', 'Venkatesh', 'Ramesh', 'Suresh', 'Ganesh', 'Mahesh'
];

// Indian cities
const cities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal', 'Visakhapatnam', 'Patna',
  'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot',
  'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Allahabad', 'Ranchi', 'Howrah'
];

// States corresponding to cities
const cityStateMap = {
  'Mumbai': 'Maharashtra',
  'Delhi': 'Delhi',
  'Bangalore': 'Karnataka',
  'Hyderabad': 'Telangana',
  'Chennai': 'Tamil Nadu',
  'Kolkata': 'West Bengal',
  'Pune': 'Maharashtra',
  'Ahmedabad': 'Gujarat',
  'Jaipur': 'Rajasthan',
  'Lucknow': 'Uttar Pradesh',
  'Kanpur': 'Uttar Pradesh',
  'Nagpur': 'Maharashtra',
  'Indore': 'Madhya Pradesh',
  'Bhopal': 'Madhya Pradesh',
  'Visakhapatnam': 'Andhra Pradesh',
  'Patna': 'Bihar',
  'Vadodara': 'Gujarat',
  'Ghaziabad': 'Uttar Pradesh',
  'Ludhiana': 'Punjab',
  'Agra': 'Uttar Pradesh',
  'Nashik': 'Maharashtra',
  'Faridabad': 'Haryana',
  'Meerut': 'Uttar Pradesh',
  'Rajkot': 'Gujarat',
  'Varanasi': 'Uttar Pradesh',
  'Srinagar': 'Jammu and Kashmir',
  'Aurangabad': 'Maharashtra',
  'Dhanbad': 'Jharkhand',
  'Amritsar': 'Punjab',
  'Allahabad': 'Uttar Pradesh',
  'Ranchi': 'Jharkhand',
  'Howrah': 'West Bengal'
};

function generatePhoneNumber() {
  // Indian phone numbers: +91 followed by 10 digits starting with 6-9
  const firstDigit = Math.floor(Math.random() * 4) + 6; // 6, 7, 8, or 9
  const remainingDigits = Math.floor(Math.random() * 900000000) + 100000000;
  return `${firstDigit}${remainingDigits}`;
}

function generateEmail(firstName, lastName, index) {
  const cleanFirst = firstName.toLowerCase().replace(/\s+/g, '');
  const cleanLast = lastName.toLowerCase().replace(/\s+/g, '');
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${cleanFirst}.${cleanLast}${index}@${domain}`;
}

async function create128Users() {
  console.log('🚀 Creating 128 users with proper Indian names, phone numbers, and emails...\n');

  const password = await bcrypt.hash('password123', 10);
  const usersCreated = [];
  const errors = [];

  try {
    for (let i = 0; i < 128; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${lastName}`;
      const city = cities[Math.floor(Math.random() * cities.length)];
      const state = cityStateMap[city];
      const phone = generatePhoneNumber();
      const email = generateEmail(firstName, lastName, i + 1);

      try {
        const user = await prisma.user.create({
          data: {
            name: fullName,
            email: email,
            phone: phone,
            password: password,
            city: city,
            state: state,
            country: 'India',
            roles: 'PLAYER,UMPIRE,ORGANIZER',
            isVerified: true,
            totalPoints: 0,
            tournamentsPlayed: 0,
            matchesWon: 0,
            matchesLost: 0,
            playerProfile: {
              create: {
                matchifyPoints: 0,
                tournamentsPlayed: 0,
                matchesWon: 0,
                matchesLost: 0
              }
            }
          }
        });

        usersCreated.push(user);
        
        if ((i + 1) % 10 === 0) {
          console.log(`✅ Created ${i + 1}/128 users...`);
        }
      } catch (error) {
        if (error.code === 'P2002') {
          // Unique constraint violation - try with different phone/email
          console.log(`⚠️  Duplicate detected for ${fullName}, retrying...`);
          i--; // Retry this iteration
        } else {
          errors.push({ name: fullName, error: error.message });
          console.log(`❌ Error creating ${fullName}: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 User creation complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successfully created: ${usersCreated.length} users`);
    console.log(`   ❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Failed users:');
      errors.forEach(err => {
        console.log(`   - ${err.name}: ${err.error}`);
      });
    }

    // Show sample of created users
    console.log('\n👥 Sample of created users:');
    usersCreated.slice(0, 10).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name}`);
      console.log(`      📧 ${user.email}`);
      console.log(`      📱 ${user.phone}`);
      console.log(`      📍 ${user.city}, ${user.state}`);
      console.log('');
    });

    // Show total user count
    const totalUsers = await prisma.user.count();
    console.log(`\n📊 Total users in database: ${totalUsers}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

create128Users()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
