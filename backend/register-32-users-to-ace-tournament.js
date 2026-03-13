import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function registerUsersToAceTournament() {
  console.log('🎾 Registering 32 users to Ace Badminton Tournament\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Find the Ace Badminton tournament
    console.log('\n📋 Step 1: Finding Ace Badminton tournament...');
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
      console.error('❌ Ace Badminton tournament not found!');
      console.log('💡 Please create the tournament first or check the name.');
      return;
    }

    console.log(`✅ Found tournament: ${tournament.name}`);
    console.log(`   ID: ${tournament.id}`);
    console.log(`   Categories: ${tournament.categories.length}`);
    
    if (tournament.categories.length === 0) {
      console.error('❌ No categories found in this tournament!');
      console.log('💡 Please add at least one category to the tournament.');
      return;
    }

    // Use the first category (or you can specify which one)
    const category = tournament.categories[0];
    console.log(`   Using category: ${category.name} (${category.format}, ${category.gender})`);
    console.log(`   Entry Fee: ₹${category.entryFee}`);

    // Step 2: Get all 32 test users
    console.log('\n👥 Step 2: Fetching 32 test users...');
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: [
            'rajesh.kumar@gmail.com',
            'priya.sharma@gmail.com',
            'amit.patel@gmail.com',
            'sneha.reddy@gmail.com',
            'vikram.singh@gmail.com',
            'ananya.iyer@gmail.com',
            'rahul.verma@gmail.com',
            'kavya.nair@gmail.com',
            'arjun.mehta@gmail.com',
            'divya.gupta@gmail.com',
            'karthik.rao@gmail.com',
            'pooja.desai@gmail.com',
            'sanjay.joshi@gmail.com',
            'meera.pillai@gmail.com',
            'aditya.kapoor@gmail.com',
            'riya.malhotra@gmail.com',
            'nikhil.agarwal@gmail.com',
            'ishita.bansal@gmail.com',
            'rohan.chopra@gmail.com',
            'tanvi.shah@gmail.com',
            'varun.bhatia@gmail.com',
            'nisha.sinha@gmail.com',
            'akash.pandey@gmail.com',
            'shreya.mishra@gmail.com',
            'manish.saxena@gmail.com',
            'anjali.tiwari@gmail.com',
            'deepak.yadav@gmail.com',
            'swati.kulkarni@gmail.com',
            'gaurav.bhatt@gmail.com',
            'neha.chauhan@gmail.com',
            'suresh.menon@gmail.com',
            'lakshmi.krishnan@gmail.com'
          ]
        }
      },
      orderBy: {
        email: 'asc'
      }
    });

    console.log(`✅ Found ${users.length} users`);

    if (users.length === 0) {
      console.error('❌ No test users found!');
      console.log('💡 Please run create-32-users.js first.');
      return;
    }

    // Step 3: Register each user
    console.log('\n📝 Step 3: Creating registrations...');
    console.log('='.repeat(60));

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Check if already registered
        const existing = await prisma.registration.findFirst({
          where: {
            userId: user.id,
            tournamentId: tournament.id,
            categoryId: category.id
          }
        });

        if (existing) {
          console.log(`⏭️  ${user.name} - Already registered`);
          skipCount++;
          continue;
        }

        // Create registration with pending status (waiting for admin approval)
        const registration = await prisma.registration.create({
          data: {
            userId: user.id,
            tournamentId: tournament.id,
            categoryId: category.id,
            amountTotal: category.entryFee,
            amountWallet: 0,
            amountRazorpay: category.entryFee,
            status: 'pending', // Waiting for admin approval
            paymentStatus: 'submitted', // Payment screenshot submitted
            paymentScreenshot: `https://res.cloudinary.com/demo/image/upload/sample_payment_${user.id}.jpg`, // Dummy screenshot URL
          }
        });

        // Create payment verification record (simulating payment screenshot submission)
        await prisma.paymentVerification.create({
          data: {
            registrationId: registration.id,
            tournamentId: tournament.id,
            userId: user.id,
            amount: category.entryFee,
            paymentScreenshot: `https://res.cloudinary.com/demo/image/upload/sample_payment_${user.id}.jpg`,
            screenshotPublicId: `sample_payment_${user.id}`,
            status: 'pending', // Waiting for admin verification
          }
        });

        // Create notification for organizer
        await prisma.notification.create({
          data: {
            userId: tournament.organizerId,
            type: 'PAYMENT_VERIFICATION_REQUIRED',
            title: 'Payment Verification Required',
            message: `${user.name} has submitted payment screenshot for ${tournament.name} - ${category.name}. Please verify.`,
            data: JSON.stringify({
              registrationId: registration.id,
              tournamentId: tournament.id,
              categoryId: category.id,
              playerName: user.name,
              amount: category.entryFee
            })
          }
        });

        console.log(`✅ ${user.name} - Registered (pending admin approval)`);
        successCount++;

      } catch (error) {
        console.error(`❌ ${user.name} - Error: ${error.message}`);
        errorCount++;
      }
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 REGISTRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully registered: ${successCount}`);
    console.log(`⏭️  Already registered: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Total users processed: ${users.length}`);
    console.log('='.repeat(60));

    console.log('\n📌 NEXT STEPS:');
    console.log('1. Login as admin/organizer');
    console.log('2. Go to Tournament Management page');
    console.log('3. You will see all registrations with status "pending"');
    console.log('4. Verify payment screenshots');
    console.log('5. Approve each registration');
    console.log('6. Status will change to "confirmed"');
    console.log('\n✅ All registrations are now waiting for admin approval!');

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
registerUsersToAceTournament();
