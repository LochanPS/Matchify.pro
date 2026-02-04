import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function approveAllRegistrations() {
  console.log('✅ Approving all pending registrations for Ace Badminton Tournament\n');
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
      return;
    }

    console.log(`✅ Found tournament: ${tournament.name}`);

    // Step 2: Get all pending registrations
    console.log('\n📝 Step 2: Finding pending registrations...');
    const pendingRegistrations = await prisma.registration.findMany({
      where: {
        tournamentId: tournament.id,
        status: 'pending',
        paymentStatus: 'submitted'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`✅ Found ${pendingRegistrations.length} pending registrations`);

    if (pendingRegistrations.length === 0) {
      console.log('💡 No pending registrations to approve.');
      return;
    }

    // Step 3: Approve each registration
    console.log('\n✅ Step 3: Approving registrations...');
    console.log('='.repeat(60));

    let successCount = 0;
    let errorCount = 0;

    for (const registration of pendingRegistrations) {
      try {
        // Update registration status to confirmed
        await prisma.registration.update({
          where: { id: registration.id },
          data: {
            status: 'confirmed',
            paymentStatus: 'completed'
          }
        });

        // Update payment verification status
        await prisma.paymentVerification.updateMany({
          where: {
            registrationId: registration.id,
            status: 'pending'
          },
          data: {
            status: 'approved',
            verifiedAt: new Date()
          }
        });

        // Increment category registration count
        await prisma.category.update({
          where: { id: registration.category.id },
          data: {
            registrationCount: {
              increment: 1
            }
          }
        });

        // Create notification for player
        await prisma.notification.create({
          data: {
            userId: registration.user.id,
            type: 'REGISTRATION_CONFIRMED',
            title: 'Registration Confirmed! 🎉',
            message: `Your registration for ${tournament.name} - ${registration.category.name} has been confirmed. Payment verified successfully.`,
            data: JSON.stringify({
              registrationId: registration.id,
              tournamentId: tournament.id,
              categoryId: registration.category.id,
              tournamentName: tournament.name,
              categoryName: registration.category.name
            })
          }
        });

        console.log(`✅ ${registration.user.name} - Approved`);
        successCount++;

      } catch (error) {
        console.error(`❌ ${registration.user.name} - Error: ${error.message}`);
        errorCount++;
      }
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 APPROVAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully approved: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Total processed: ${pendingRegistrations.length}`);
    console.log('='.repeat(60));

    // Step 5: Show tournament stats
    console.log('\n📊 TOURNAMENT STATS:');
    const allRegistrations = await prisma.registration.findMany({
      where: {
        tournamentId: tournament.id
      },
      include: {
        category: true
      }
    });

    const stats = {
      total: allRegistrations.length,
      confirmed: allRegistrations.filter(r => r.status === 'confirmed').length,
      pending: allRegistrations.filter(r => r.status === 'pending').length,
      cancelled: allRegistrations.filter(r => r.status === 'cancelled').length
    };

    console.log(`   Total Registrations: ${stats.total}`);
    console.log(`   ✅ Confirmed: ${stats.confirmed}`);
    console.log(`   ⏳ Pending: ${stats.pending}`);
    console.log(`   ❌ Cancelled: ${stats.cancelled}`);

    // Category breakdown
    console.log('\n📊 CATEGORY BREAKDOWN:');
    for (const category of tournament.categories) {
      const categoryRegs = allRegistrations.filter(r => r.categoryId === category.id);
      console.log(`   ${category.name}: ${categoryRegs.length} registrations`);
    }

    console.log('\n✅ All registrations approved successfully!');
    console.log('💡 Players have been notified via notifications.');

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
approveAllRegistrations();
