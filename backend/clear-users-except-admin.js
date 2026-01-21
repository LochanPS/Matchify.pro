import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clearUsersExceptAdmin() {
  try {
    console.log('🔍 Starting user data cleanup...\n');

    // Find admin user (case-insensitive)
    const adminUser = await prisma.user.findFirst({
      where: { 
        email: {
          equals: 'admin@gmail.com',
          mode: 'insensitive'
        }
      }
    });

    if (!adminUser) {
      console.log('⚠️  Admin user (admin@gmail.com) not found!');
      console.log('Please check the email address.\n');
      process.exit(1);
    }

    console.log('✅ Found admin user:', adminUser.email);
    console.log('   User ID:', adminUser.id);
    console.log('   Name:', adminUser.name);
    console.log('   Roles:', adminUser.roles);
    console.log('');

    // Count users to be deleted
    const usersToDelete = await prisma.user.count({
      where: {
        id: {
          not: adminUser.id
        }
      }
    });

    console.log(`📊 Found ${usersToDelete} users to delete (excluding ${adminUser.email})\n`);

    if (usersToDelete === 0) {
      console.log('✅ No users to delete. Database is clean!');
      process.exit(0);
    }

    // Get list of users to be deleted (for logging)
    const usersList = await prisma.user.findMany({
      where: {
        id: {
          not: adminUser.id
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true
      }
    });

    console.log('📋 Users to be deleted:');
    usersList.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name}) - ${user.roles}`);
    });
    console.log('');

    // Delete related data first (to avoid foreign key constraints)
    console.log('🗑️  Deleting related data...\n');

    // Delete registrations for non-admin users
    const deletedRegistrations = await prisma.registration.deleteMany({
      where: {
        userId: {
          not: adminUser.id
        }
      }
    });
    console.log(`   ✓ Deleted ${deletedRegistrations.count} registrations`);

    // Delete tournaments created by non-admin users
    const deletedTournaments = await prisma.tournament.deleteMany({
      where: {
        organizerId: {
          not: adminUser.id
        }
      }
    });
    console.log(`   ✓ Deleted ${deletedTournaments.count} tournaments`);

    // Delete academies owned by non-admin users
    const deletedAcademies = await prisma.academy.deleteMany({
      where: {
        submittedBy: {
          not: adminUser.id
        }
      }
    });
    console.log(`   ✓ Deleted ${deletedAcademies.count} academies`);

    // Delete KYC records for non-admin users
    try {
      const deletedKYCs = await prisma.kYCSubmission.deleteMany({
        where: {
          organizerId: {
            not: adminUser.id
          }
        }
      });
      console.log(`   ✓ Deleted ${deletedKYCs.count} KYC records`);
    } catch (error) {
      console.log('   ⚠️  KYC table not found or error (skipping)');
    }

    // Delete wallet transactions for non-admin users
    try {
      const deletedWalletTransactions = await prisma.walletTransaction.deleteMany({
        where: {
          userId: {
            not: adminUser.id
          }
        }
      });
      console.log(`   ✓ Deleted ${deletedWalletTransactions.count} wallet transactions`);
    } catch (error) {
      console.log('   ⚠️  Wallet transactions table error (skipping)');
    }

    // Delete notifications for non-admin users
    try {
      const deletedNotifications = await prisma.notification.deleteMany({
        where: {
          userId: {
            not: adminUser.id
          }
        }
      });
      console.log(`   ✓ Deleted ${deletedNotifications.count} notifications`);
    } catch (error) {
      console.log('   ⚠️  Notifications table error (skipping)');
    }

    // Delete refresh tokens for non-admin users
    try {
      const deletedTokens = await prisma.refreshToken.deleteMany({
        where: {
          userId: {
            not: adminUser.id
          }
        }
      });
      console.log(`   ✓ Deleted ${deletedTokens.count} refresh tokens`);
    } catch (error) {
      console.log('   ⚠️  Refresh tokens table error (skipping)');
    }

    // Delete audit logs for non-admin users (if they exist)
    try {
      const deletedAuditLogs = await prisma.auditLog.deleteMany({
        where: {
          adminId: {
            not: adminUser.id
          }
        }
      });
      console.log(`   ✓ Deleted ${deletedAuditLogs.count} audit logs`);
    } catch (error) {
      console.log('   ⚠️  Audit logs table not found (skipping)');
    }

    // Delete invites created by non-admin users (if they exist)
    try {
      const deletedInvites = await prisma.invite.deleteMany({
        where: {
          invitedById: {
            not: adminUser.id
          }
        }
      });
      console.log(`   ✓ Deleted ${deletedInvites.count} invites`);
    } catch (error) {
      console.log('   ⚠️  Invites table not found (skipping)');
    }

    console.log('');

    // Finally, delete the users
    console.log('🗑️  Deleting users...\n');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: {
          not: adminUser.id
        }
      }
    });

    console.log(`   ✓ Deleted ${deletedUsers.count} users\n`);

    // Verify admin user still exists
    const adminStillExists = await prisma.user.findUnique({
      where: { id: adminUser.id }
    });

    if (adminStillExists) {
      console.log('✅ SUCCESS! All users deleted except', adminStillExists.email);
      console.log('');
      console.log('📊 Final Summary:');
      console.log(`   • Users deleted: ${deletedUsers.count}`);
      console.log(`   • Registrations deleted: ${deletedRegistrations.count}`);
      console.log(`   • Tournaments deleted: ${deletedTournaments.count}`);
      console.log(`   • Academies deleted: ${deletedAcademies.count}`);
      console.log('');
      console.log('✅ Admin user preserved:', adminStillExists.email);
    } else {
      console.log('❌ ERROR: Admin user was accidentally deleted!');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
clearUsersExceptAdmin();
