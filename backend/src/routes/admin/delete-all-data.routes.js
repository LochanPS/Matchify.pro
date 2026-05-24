import express from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Danger Zone — deletes tournament data, preserves all user accounts
// Must be set via environment variables, no hardcoded fallback
const DANGER_ZONE_PASSWORD = process.env.DANGER_ZONE_PASSWORD;
const NUCLEAR_ZONE_PASSWORD = process.env.NUCLEAR_ZONE_PASSWORD;
if (!DANGER_ZONE_PASSWORD || !NUCLEAR_ZONE_PASSWORD) {
  console.error('❌ DANGER_ZONE_PASSWORD and NUCLEAR_ZONE_PASSWORD env vars must be set');
}

/**
 * POST /api/admin/delete-all-info
 * Delete all data and reset everything to zero
 * Requires admin authentication + special password
 */
router.post('/delete-all-info', authenticate, async (req, res) => {
  try {
    const { password } = req.body;

    // Check if user is admin
    if (!req.user.roles || !req.user.roles.includes('ADMIN')) {
      return res.status(403).json({
        success: false,
        error: 'Only admins can delete all data'
      });
    }

    // Verify Danger Zone password
    if (password !== DANGER_ZONE_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

    console.log('🗑️  DELETE ALL DATA initiated by:', req.user.email);

    // Delete all data in correct order (respecting foreign key constraints)
    // Wrapped in a transaction so partial failure rolls back everything
    const deletionResults = await prisma.$transaction(async (tx) => {
    const r = {};

    // 1. Delete match-related data
    r.matchScores = await tx.match.deleteMany({});

    // 2. Delete draws
    r.draws = await tx.draw.deleteMany({});

    // 3. Delete registrations
    r.registrations = await tx.registration.deleteMany({});

    // 4. Delete payment verifications
    r.paymentVerifications = await tx.paymentVerification.deleteMany({});

    // 5. Delete categories
    r.categories = await tx.category.deleteMany({});

    // 6. Delete tournament payments
    r.tournamentPayments = await tx.tournamentPayment.deleteMany({});

    // 7. Delete tournament posters
    r.tournamentPosters = await tx.tournamentPoster.deleteMany({});

    // 8. Delete tournament umpires
    r.tournamentUmpires = await tx.tournamentUmpire.deleteMany({});

    // 9. Delete tournaments
    r.tournaments = await tx.tournament.deleteMany({});

    // 10. Delete wallet transactions
    r.walletTransactions = await tx.walletTransaction.deleteMany({});

    // 11. Delete notifications
    r.notifications = await tx.notification.deleteMany({});

    // 12. Delete score correction requests
    r.scoreCorrectionRequests = await tx.scoreCorrectionRequest.deleteMany({});

    // 15. Delete SMS logs
    r.smsLogs = await tx.smsLog.deleteMany({});

    // 16. Delete audit logs
    r.auditLogs = await tx.auditLog.deleteMany({});

    // 17. Delete academies
    r.academies = await tx.academy.deleteMany({});

    // 18. Delete organizer KYC submissions
    r.organizerKYC = await tx.organizerKYC.deleteMany({});

    // 19. Delete organizer requests
    r.organizerRequests = await tx.organizerRequest.deleteMany({});

    // 20. Delete payment settings
    r.paymentSettings = await tx.paymentSettings.deleteMany({});

    // 21. Reset all users' tournament-related stats to 0 (PRESERVE ALL USER ACCOUNTS)
    r.usersReset = await tx.user.updateMany({
      data: {
        walletBalance: 0,
        totalPoints: 0,
        tournamentsPlayed: 0,
        tournamentsRegistered: 0,
        matchesWon: 0,
        matchesLost: 0,
        matchesUmpired: 0
      }
    });

    // DO NOT DELETE USERS - All user accounts are preserved
    return r;
    }, { timeout: 30000 });

    console.log('✅ All data deleted successfully');
    console.log('📊 Deletion results:', deletionResults);

    res.json({
      success: true,
      message: 'All tournament data deleted successfully. All user accounts preserved.',
      deletionResults: {
        matches: deletionResults.matchScores.count,
        draws: deletionResults.draws.count,
        registrations: deletionResults.registrations.count,
        paymentVerifications: deletionResults.paymentVerifications.count,
        categories: deletionResults.categories.count,
        tournamentPayments: deletionResults.tournamentPayments.count,
        tournamentPosters: deletionResults.tournamentPosters.count,
        tournamentUmpires: deletionResults.tournamentUmpires.count,
        tournaments: deletionResults.tournaments.count,
        walletTransactions: deletionResults.walletTransactions.count,
        notifications: deletionResults.notifications.count,
        scoreCorrectionRequests: deletionResults.scoreCorrectionRequests.count,
        smsLogs: deletionResults.smsLogs.count,
        auditLogs: deletionResults.auditLogs.count,
        academies: deletionResults.academies.count,
        organizerKYC: deletionResults.organizerKYC.count,
        organizerRequests: deletionResults.organizerRequests.count,
        paymentSettings: deletionResults.paymentSettings.count,
        usersReset: deletionResults.usersReset.count,
        usersPreserved: true,
        usersDeleted: 0
      }
    });

  } catch (error) {
    console.error('❌ Error deleting all data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete all data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/admin/complete-system-reset
 * NUCLEAR OPTION: Delete ALL data including ALL users (except admin)
 * Requires admin authentication + special password
 */
router.post('/complete-system-reset', authenticate, async (req, res) => {
  try {
    const { password } = req.body;

    // Check if user is admin
    if (!req.user.roles || !req.user.roles.includes('ADMIN')) {
      return res.status(403).json({
        success: false,
        error: 'Only admins can perform complete system reset'
      });
    }

    // Verify Nuclear Zone password
    if (password !== NUCLEAR_ZONE_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return res.status(500).json({ success: false, error: 'ADMIN_EMAIL env var not set — reset aborted to prevent deleting admin account' });
    }

    console.log('☢️  COMPLETE SYSTEM RESET initiated by:', req.user.email);
    console.log('⚠️  This will delete ALL users except admin!');

    // All deletes wrapped in a transaction so partial failure rolls back everything
    const deletionResults = await prisma.$transaction(async (tx) => {
    const r = {};

    // STEP 1: Delete all match-related data
    r.matchScores = await tx.match.deleteMany({});

    // STEP 2: Delete draws
    r.draws = await tx.draw.deleteMany({});

    // STEP 3: Delete registrations
    r.registrations = await tx.registration.deleteMany({});

    // STEP 4: Delete payment verifications
    r.paymentVerifications = await tx.paymentVerification.deleteMany({});

    // STEP 5: Delete categories
    r.categories = await tx.category.deleteMany({});

    // STEP 6: Delete tournament payments
    r.tournamentPayments = await tx.tournamentPayment.deleteMany({});

    // STEP 7: Delete tournament posters
    r.tournamentPosters = await tx.tournamentPoster.deleteMany({});

    // STEP 8: Delete tournament umpires
    r.tournamentUmpires = await tx.tournamentUmpire.deleteMany({});

    // STEP 9: Delete tournaments
    r.tournaments = await tx.tournament.deleteMany({});

    // STEP 10: Delete wallet transactions
    r.walletTransactions = await tx.walletTransaction.deleteMany({});

    // STEP 11: Delete notifications
    r.notifications = await tx.notification.deleteMany({});

    // STEP 12: Delete score correction requests
    r.scoreCorrectionRequests = await tx.scoreCorrectionRequest.deleteMany({});

    // STEP 13: Delete SMS logs
    r.smsLogs = await tx.smsLog.deleteMany({});

    // STEP 14: Delete audit logs
    r.auditLogs = await tx.auditLog.deleteMany({});

    // STEP 15: Delete academies
    r.academies = await tx.academy.deleteMany({});

    // STEP 16: Delete organizer KYC submissions
    r.organizerKYC = await tx.organizerKYC.deleteMany({});

    // STEP 17: Delete organizer requests
    r.organizerRequests = await tx.organizerRequest.deleteMany({});

    // STEP 18: Delete payment settings
    r.paymentSettings = await tx.paymentSettings.deleteMany({});

    // STEP 19: Delete user profiles (must be before users)
    r.playerProfiles = await tx.playerProfile.deleteMany({
      where: { user: { email: { not: adminEmail } } }
    });

    r.organizerProfiles = await tx.organizerProfile.deleteMany({
      where: { user: { email: { not: adminEmail } } }
    });

    r.umpireProfiles = await tx.umpireProfile.deleteMany({
      where: { user: { email: { not: adminEmail } } }
    });

    // STEP 20: DELETE ALL USERS EXCEPT ADMIN
    r.usersDeleted = await tx.user.deleteMany({
      where: { email: { not: adminEmail } }
    });

    return r;
    }, { timeout: 30000 });

    console.log('☢️  COMPLETE SYSTEM RESET SUCCESSFUL');
    console.log('📊 Deletion results:', deletionResults);

    res.json({
      success: true,
      message: 'Complete system reset successful. All data deleted except admin account.',
      deletionResults: {
        matches: deletionResults.matchScores.count,
        draws: deletionResults.draws.count,
        registrations: deletionResults.registrations.count,
        paymentVerifications: deletionResults.paymentVerifications.count,
        categories: deletionResults.categories.count,
        tournamentPayments: deletionResults.tournamentPayments.count,
        tournamentPosters: deletionResults.tournamentPosters.count,
        tournamentUmpires: deletionResults.tournamentUmpires.count,
        tournaments: deletionResults.tournaments.count,
        walletTransactions: deletionResults.walletTransactions.count,
        notifications: deletionResults.notifications.count,
        scoreCorrectionRequests: deletionResults.scoreCorrectionRequests.count,
        smsLogs: deletionResults.smsLogs.count,
        auditLogs: deletionResults.auditLogs.count,
        academies: deletionResults.academies.count,
        organizerKYC: deletionResults.organizerKYC.count,
        organizerRequests: deletionResults.organizerRequests.count,
        paymentSettings: deletionResults.paymentSettings.count,
        playerProfiles: deletionResults.playerProfiles.count,
        organizerProfiles: deletionResults.organizerProfiles.count,
        umpireProfiles: deletionResults.umpireProfiles.count,
        usersDeleted: deletionResults.usersDeleted.count,
        adminPreserved: true
      }
    });

  } catch (error) {
    console.error('❌ Error in complete system reset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform complete system reset',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
