import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createPendingPayments() {
  try {
    console.log('🔄 Creating some pending payment verifications for demo...');
    
    // Get the tournament and its categories
    const tournament = await prisma.tournament.findFirst({
      include: {
        categories: {
          select: { id: true, name: true, gender: true, entryFee: true }
        }
      }
    });
    
    if (!tournament) {
      console.log('❌ No tournament found');
      return;
    }
    
    console.log(`🏆 Tournament: ${tournament.name}`);
    console.log(`📋 Categories:`, tournament.categories.map(c => `${c.name} (${c.gender}) - ₹${c.entryFee}`));
    
    // Create 5 test users with pending payments
    const timestamp = Date.now();
    const testUsers = [
      { name: 'Test User 1', email: `testuser1_${timestamp}@gmail.com`, phone: `987654321${Math.floor(Math.random() * 10)}`, gender: 'male' },
      { name: 'Test User 2', email: `testuser2_${timestamp}@gmail.com`, phone: `987654322${Math.floor(Math.random() * 10)}`, gender: 'female' },
      { name: 'Test User 3', email: `testuser3_${timestamp}@gmail.com`, phone: `987654323${Math.floor(Math.random() * 10)}`, gender: 'male' },
      { name: 'Test User 4', email: `testuser4_${timestamp}@gmail.com`, phone: `987654324${Math.floor(Math.random() * 10)}`, gender: 'female' },
      { name: 'Test User 5', email: `testuser5_${timestamp}@gmail.com`, phone: `987654325${Math.floor(Math.random() * 10)}`, gender: 'male' }
    ];
    
    for (const userData of testUsers) {
      // Find appropriate category based on gender
      const category = tournament.categories.find(c => 
        c.gender === userData.gender || c.gender === 'mixed'
      );
      
      if (!category) {
        console.log(`❌ No category found for ${userData.gender}`);
        continue;
      }
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: '$2b$10$hashedpassword', // dummy hash
          name: userData.name,
          phone: userData.phone,
          roles: 'PLAYER',
          gender: userData.gender,
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          dateOfBirth: new Date('1995-01-01'),
          isActive: true,
          isVerified: true
        }
      });
      
      // Create registration
      const registration = await prisma.registration.create({
        data: {
          userId: user.id,
          tournamentId: tournament.id,
          categoryId: category.id,
          status: 'pending',
          paymentStatus: 'pending',
          amountTotal: category.entryFee,
          createdAt: new Date()
        }
      });
      
      // Create payment verification with pending status
      await prisma.paymentVerification.create({
        data: {
          registrationId: registration.id,
          tournamentId: tournament.id,
          userId: user.id,
          amount: category.entryFee,
          status: 'pending',
          paymentScreenshot: '/uploads/payment-screenshots/test-screenshot.jpg',
          submittedAt: new Date()
        }
      });
      
      console.log(`✅ Created pending payment for ${userData.name} (${category.name} - ₹${category.entryFee})`);
    }
    
    console.log('🎉 Created 5 pending payment verifications for testing!');
    
    // Show updated counts
    const pendingCount = await prisma.paymentVerification.count({ where: { status: 'pending' } });
    console.log(`📊 Total pending payments: ${pendingCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createPendingPayments();