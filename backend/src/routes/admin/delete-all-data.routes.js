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
    const deletionResults = {};

    // 1. Delete match-related data
    deletionResults.matchScores = await prisma.match.deleteMany({});
    
    // 2. Delete draws
    deletionResults.draws = await prisma.draw.deleteMany({});
    
    // 3. Delete registrations
    deletionResults.registrations = await prisma.registration.deleteMany({});
    
    // 4. Delete payment verifications
    deletionResults.paymentVerifications = await prisma.paymentVerification.deleteMany({});
    
    // 5. Delete categories
    deletionResults.categories = await prisma.category.deleteMany({});
    
    // 6. Delete tournament payments
    deletionResults.tournamentPayments = await prisma.tournamentPayment.deleteMany({});
    
    // 7. Delete tournament posters
    deletionResults.tournamentPosters = await prisma.tournamentPoster.deleteMany({});
    
    // 8. Delete tournament umpires
    deletionResults.tournamentUmpires = await prisma.tournamentUmpire.deleteMany({});
    
    // 9. Delete tournaments
    deletionResults.tournaments = await prisma.tournament.deleteMany({});
    
    // 10. Delete wallet transactions
    deletionResults.walletTransactions = await prisma.walletTransaction.deleteMany({});
    
    // 11. Delete notifications
    deletionResults.notifications = await prisma.notification.deleteMany({});
    
    // 12. Delete score correction requests
    deletionResults.scoreCorrectionRequests = await prisma.scoreCorrectionRequest.deleteMany({});
    
    // 15. Delete SMS logs
    deletionResults.smsLogs = await prisma.smsLog.deleteMany({});
    
    // 16. Delete audit logs
    deletionResults.auditLogs = await prisma.auditLog.deleteMany({});
    
    // 17. Delete academies
    deletionResults.academies = await prisma.academy.deleteMany({});
    
    // 18. Delete organizer KYC submissions
    deletionResults.organizerKYC = await prisma.organizerKYC.deleteMany({});
    
    // 19. Delete organizer requests
    deletionResults.organizerRequests = await prisma.organizerRequest.deleteMany({});
    
    // 20. Delete payment settings
    deletionResults.paymentSettings = await prisma.paymentSettings.deleteMany({});
    
    // 21. Reset all users' tournament-related stats to 0 (PRESERVE ALL USER ACCOUNTS)
    deletionResults.usersReset = await prisma.user.updateMany({
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

    console.log('☢️  COMPLETE SYSTEM RESET initiated by:', req.user.email);
    console.log('⚠️  This will delete ALL users except admin!');

    const deletionResults = {};

    // STEP 1: Delete all match-related data
    deletionResults.matchScores = await prisma.match.deleteMany({});
    
    // STEP 2: Delete draws
    deletionResults.draws = await prisma.draw.deleteMany({});
    
    // STEP 3: Delete registrations
    deletionResults.registrations = await prisma.registration.deleteMany({});
    
    // STEP 4: Delete payment verifications
    deletionResults.paymentVerifications = await prisma.paymentVerification.deleteMany({});
    
    // STEP 5: Delete categories
    deletionResults.categories = await prisma.category.deleteMany({});
    
    // STEP 6: Delete tournament payments
    deletionResults.tournamentPayments = await prisma.tournamentPayment.deleteMany({});
    
    // STEP 7: Delete tournament posters
    deletionResults.tournamentPosters = await prisma.tournamentPoster.deleteMany({});
    
    // STEP 8: Delete tournament umpires
    deletionResults.tournamentUmpires = await prisma.tournamentUmpire.deleteMany({});
    
    // STEP 9: Delete tournaments
    deletionResults.tournaments = await prisma.tournament.deleteMany({});
    
    // STEP 10: Delete wallet transactions
    deletionResults.walletTransactions = await prisma.walletTransaction.deleteMany({});
    
    // STEP 11: Delete notifications
    deletionResults.notifications = await prisma.notification.deleteMany({});
    
    // STEP 12: Delete score correction requests
    deletionResults.scoreCorrectionRequests = await prisma.scoreCorrectionRequest.deleteMany({});
    
    // STEP 13: Delete SMS logs
    deletionResults.smsLogs = await prisma.smsLog.deleteMany({});
    
    // STEP 14: Delete audit logs
    deletionResults.auditLogs = await prisma.auditLog.deleteMany({});
    
    // STEP 15: Delete academies
    deletionResults.academies = await prisma.academy.deleteMany({});
    
    // STEP 16: Delete organizer KYC submissions
    deletionResults.organizerKYC = await prisma.organizerKYC.deleteMany({});
    
    // STEP 17: Delete organizer requests
    deletionResults.organizerRequests = await prisma.organizerRequest.deleteMany({});
    
    // STEP 18: Delete payment settings
    deletionResults.paymentSettings = await prisma.paymentSettings.deleteMany({});
    
    // STEP 19: Delete user profiles (must be before users)
    deletionResults.playerProfiles = await prisma.playerProfile.deleteMany({
      where: {
        user: {
          email: { not: 'ADMIN@gmail.com' }
        }
      }
    });
    
    deletionResults.organizerProfiles = await prisma.organizerProfile.deleteMany({
      where: {
        user: {
          email: { not: 'ADMIN@gmail.com' }
        }
      }
    });
    
    deletionResults.umpireProfiles = await prisma.umpireProfile.deleteMany({
      where: {
        user: {
          email: { not: 'ADMIN@gmail.com' }
        }
      }
    });
    
    // STEP 20: DELETE ALL USERS EXCEPT ADMIN
    deletionResults.usersDeleted = await prisma.user.deleteMany({
      where: {
        email: { not: 'ADMIN@gmail.com' }
      }
    });

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
