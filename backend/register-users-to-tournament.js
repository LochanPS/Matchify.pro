import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function registerUsersToTournament() {
  try {
    console.log('🎾 Finding "ace badminton" tournament...\n');

    // Find the tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: {
          contains: 'ace',
          mode: 'insensitive'
        }
      },
      include: {
        categories: true
      }
    });

    if (!tournament) {
      console.log('❌ Tournament not found!');
      return;
    }

    console.log(`✅ Found tournament: ${tournament.name}`);
    console.log(`   ID: ${tournament.id}`);
    console.log(`   Categories: ${tournament.categories.length}\n`);

    // Get all 8 users we just created
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: [
            'rahul.sharma@gmail.com',
            'priya.patel@gmail.com',
            'amit.kumar@gmail.com',
            'sneha.reddy@gmail.com',
            'vikram.singh@gmail.com',
            'anjali.verma@gmail.com',
            'rohan.gupta@gmail.com',
            'kavya.nair@gmail.com'
          ]
        }
      }
    });

    console.log(`✅ Found ${users.length} users to register\n`);

    if (tournament.categories.length === 0) {
      console.log('❌ No categories found in tournament!');
      return;
    }

    // Register each user to appropriate categories based on gender and format
    let registrationCount = 0;

    for (const user of users) {
      console.log(`\n📝 Registering ${user.name}...`);

      // Find suitable categories for this user
      const suitableCategories = tournament.categories.filter(cat => {
        // Match gender - mixed accepts all, otherwise must match
        const genderMatch = cat.gender.toUpperCase() === 'MIXED' || 
                           cat.gender.toUpperCase() === user.gender.toUpperCase();
        
        if (!genderMatch) {
          return false;
        }
        
        // Accept both singles and doubles formats
        const formatLower = cat.format.toLowerCase();
        if (formatLower === 'singles' || formatLower === 'doubles') {
          return true;
        }
        
        return false;
      });

      for (const category of suitableCategories) {
        // Check if already registered
        const existingReg = await prisma.registration.findFirst({
          where: {
            userId: user.id,
            categoryId: category.id
          }
        });

        if (existingReg) {
          console.log(`   ⚠️  Already registered for ${category.name}`);
          continue;
        }

        // Create registration with admin-approved payment
        const registration = await prisma.registration.create({
          data: {
            userId: user.id,
            categoryId: category.id,
            tournamentId: tournament.id,
            paymentStatus: 'verified', // Admin verified
            status: 'confirmed',
            amountTotal: category.entryFee,
            amountWallet: 0,
            amountRazorpay: category.entryFee,
            razorpayPaymentId: `ADMIN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
        });

        console.log(`   ✅ Registered for ${category.name} (${category.format}) - ₹${category.entryFee}`);
        registrationCount++;
      }
    }

    console.log(`\n\n🎉 Registration completed!`);
    console.log(`   Total registrations: ${registrationCount}`);
    console.log(`   Tournament: ${tournament.name}`);
    console.log(`   All payments marked as ADMIN_APPROVED\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

registerUsersToTournament();
